/**
 * Dodo webhook receiver, as a Cloudflare Pages Function.
 *
 * Shape of the handler, and why:
 *
 *   verify signature over the raw body
 *   -> store the event, keyed on the provider's event id
 *   -> acknowledge
 *   -> apply the state change
 *
 * Storing before acting is what makes redelivery safe: the insert collides on
 * the event id and the second delivery becomes a no-op instead of a second
 * application. Acknowledging before the slow part keeps the provider from
 * retrying a delivery we already have, and the Workers free plan allows 10 ms
 * of CPU per request, so the handler must not do real work inline.
 *
 * A failure after acknowledgement leaves the row unprocessed with its error
 * recorded, which is what the reconciliation job picks up.
 */

import {
  readWebhookHeaders, verifyWebhook,
} from "../../../src/lib/billing/server/webhook-signature";
import {
  readSubscriptionEvent, shouldApply, UnmappedProductError,
  type ProductMap, type ProviderEvent, type SubscriptionState,
} from "../../../src/lib/billing/server/webhook-state";

type Env = {
  DB: D1Database;
  DODO_WEBHOOK_SECRET: string;
  DODO_PRODUCT_PRO_MONTHLY?: string;
  DODO_PRODUCT_PRO_ANNUAL?: string;
  DODO_PRODUCT_TEAMS_MONTHLY?: string;
  DODO_PRODUCT_TEAMS_ANNUAL?: string;
};

export function buildProductMap(env: Env): ProductMap {
  const map = new Map<string, { plan: "pro" | "teams"; interval: "monthly" | "annual" }>();
  const add = (id: string | undefined, plan: "pro" | "teams", interval: "monthly" | "annual") => {
    if (id) map.set(id, { plan, interval });
  };
  add(env.DODO_PRODUCT_PRO_MONTHLY, "pro", "monthly");
  add(env.DODO_PRODUCT_PRO_ANNUAL, "pro", "annual");
  add(env.DODO_PRODUCT_TEAMS_MONTHLY, "teams", "monthly");
  add(env.DODO_PRODUCT_TEAMS_ANNUAL, "teams", "annual");
  return map;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env, waitUntil } = context;

  if (!env.DODO_WEBHOOK_SECRET) {
    // Refuse rather than accept unverified deliveries. A misconfigured
    // endpoint that returns 200 looks healthy while trusting anyone.
    return new Response("webhook secret is not configured", { status: 503 });
  }

  const rawBody = await request.text();
  const verified = await verifyWebhook(
    rawBody, readWebhookHeaders(request.headers), env.DODO_WEBHOOK_SECRET,
  );
  if (!verified.ok) {
    return new Response(verified.reason, { status: 400 });
  }

  let event: ProviderEvent;
  try {
    event = JSON.parse(rawBody) as ProviderEvent;
  } catch {
    return new Response("body is not JSON", { status: 400 });
  }

  const now = Math.floor(Date.now() / 1000);
  const inserted = await env.DB.prepare(
    `INSERT INTO webhook_events (id, provider, type, payload, received_at)
     VALUES (?, 'dodo', ?, ?, ?) ON CONFLICT(id) DO NOTHING`,
  ).bind(verified.id, event.type ?? "unknown", rawBody, now).run();

  // No row inserted means we have seen this event id before.
  if (!inserted.meta.changes) {
    return new Response("duplicate", { status: 200 });
  }

  waitUntil(applyEvent(env, verified.id, event, now));
  return new Response("accepted", { status: 202 });
};

async function applyEvent(env: Env, eventId: string, event: ProviderEvent, now: number) {
  try {
    const state = readSubscriptionEvent(event, buildProductMap(env), now);
    if (state) await persist(env, state);
    await env.DB.prepare(
      `UPDATE webhook_events SET processed_at = ?, attempts = attempts + 1 WHERE id = ?`,
    ).bind(Math.floor(Date.now() / 1000), eventId).run();
  } catch (error) {
    const message = error instanceof UnmappedProductError
      ? error.message
      : String((error as Error)?.message ?? error);
    await env.DB.prepare(
      `UPDATE webhook_events SET error = ?, attempts = attempts + 1 WHERE id = ?`,
    ).bind(message, eventId).run();
  }
}

async function persist(env: Env, state: SubscriptionState) {
  const existing = await env.DB.prepare(
    `SELECT id, provider_updated_at FROM subscriptions
     WHERE provider = 'dodo' AND provider_customer_id = ?`,
  ).bind(state.providerCustomerId).first<{ id: string; provider_updated_at: number }>();

  if (existing && !shouldApply({ providerUpdatedAt: existing.provider_updated_at }, state)) {
    return; // An older or repeated event; the stored state is newer.
  }

  const now = Math.floor(Date.now() / 1000);
  if (existing) {
    await env.DB.prepare(
      `UPDATE subscriptions SET provider_product_id = ?, plan = ?, interval = ?,
         status = ?, quantity = ?, current_period_end = ?, cancel_at = ?,
         provider_updated_at = ?, updated_at = ?
       WHERE id = ?`,
    ).bind(state.providerProductId, state.plan, state.interval, state.status,
      state.quantity, state.currentPeriodEnd, state.cancelAt,
      state.providerUpdatedAt, now, existing.id).run();
    return;
  }

  // An unknown customer is recorded, not dropped: the account link is made
  // when that customer next signs in, and losing the event would lose a
  // payment that already happened.
  await env.DB.prepare(
    `INSERT INTO subscriptions (id, provider, provider_customer_id, provider_product_id,
       plan, interval, status, quantity, current_period_end, cancel_at,
       provider_updated_at, updated_at, account_id, organization_id)
     VALUES (?, 'dodo', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL)`,
  ).bind(crypto.randomUUID(), state.providerCustomerId, state.providerProductId,
    state.plan, state.interval, state.status, state.quantity,
    state.currentPeriodEnd, state.cancelAt, state.providerUpdatedAt, now).run();
}
