/**
 * Who the caller is, and what they may do.
 *
 * The client has the same entitlement table and uses it to decide what to
 * offer. This is the answer that counts: resolved on the server from stored
 * subscription state, so it survives a cleared browser, a second device, and
 * anyone editing the table in their own console.
 */
import {
  ACCOUNT_SUBSCRIPTIONS_SQL,
  groupSubscriptions,
  type SubscriptionRow,
} from "../../../src/lib/billing/server/load-subscriptions";
import { resolveEntitlement } from "../../../src/lib/billing/server/entitlement";
import { type Env, currentAccount, json } from "./_shared";

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const account = await currentAccount(request, env);

  if (!account) {
    // Signed out is still an answer about entitlement, and it is "free".
    // Returning null alone would make every caller repeat that assumption.
    const anonymous = resolveEntitlement({ personal: null, organization: [] }, Date.now());
    return json({
      account: null,
      plan: anonymous.plan,
      entitlements: anonymous.entitlements,
      reason: "not signed in",
      seats: anonymous.seats,
      expiresAt: null,
    });
  }

  const { results } = await env.DB.prepare(ACCOUNT_SUBSCRIPTIONS_SQL)
    .bind(account.accountId)
    .all<SubscriptionRow>();

  const resolved = resolveEntitlement(groupSubscriptions(results ?? []), Date.now());

  return json({
    account: {
      id: account.accountId,
      email: account.email,
      emailVerified: false,
    },
    plan: resolved.plan,
    entitlements: resolved.entitlements,
    reason: resolved.reason,
    seats: resolved.seats,
    expiresAt: resolved.expiresAt,
  });
};
