/** Who the caller is, if anyone. The client uses this to decide what to show. */
import { type Env, currentAccount, json } from "./_shared";

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const account = await currentAccount(request, env);
  if (!account) return json({ account: null }, 200);
  return json(
    { account: { id: account.accountId, email: account.email, emailVerified: false } },
    200
  );
};
