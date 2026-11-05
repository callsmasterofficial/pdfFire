# Sign-in, and entitlements that actually reach the UI

Accounts existed as endpoints with nothing linking to them, and the
entitlement table had never been connected to anything. This joins the two
ends.

## The bug this turned up

The dropzone capped every document at a fixed 100 MB. That is exactly the
**Free** allowance, so a Pro subscriber — entitled to 1 GB — was held to the
limit they had paid to leave behind. The cap existed and ignored the plan
entirely, which is the worst of both: it looks enforced and it punishes the
wrong people.

The cap now comes from the resolved plan, and a caller asking for something
smaller still wins, because a tool with its own reason to restrict a file
should keep it.

## How entitlement actually resolves

`/api/auth/session` answers both questions at once — who you are, and what you
may do. The plan is resolved **on the server** from stored subscription rows,
never from anything the client sends:

```
D1 subscriptions  ->  groupSubscriptions  ->  resolveEntitlement  ->  session
```

The client ships the same entitlement table, and that is fine: it decides what
to *offer*, not what has been paid for. Editing it in a console changes the
menu, not the answer.

Signed out is still an answer, not an absence. It returns the Free plan with a
reason of "not signed in", so no caller has to re-derive that assumption, and
a failed session read also falls back to Free — the only direction it is safe
to be wrong in.

## Verified end to end

Against a real D1, through the real endpoints:

| | plan | maxFileSizeMb | reason |
|---|---|---|---|
| signed out | free | 100 | not signed in |
| new account | free | 100 | no active subscription |
| after an active Pro row | **pro** | **1024** | subscription is active |

The Pro row also flipped `batchQueueSize` 20 → 500 and `desktopBuilds` false →
true, so the whole table moves, not one field.

Then through the browser, not just the API: signing in on `/account` shows
**Plan: FileMelo Pro**, the reason `subscription is active`, and the note that
the address is unverified.

One honest note on method: the first run of that check reported "not signed
in" after a successful registration, which looked like a broken cookie. It was
the registration rate limit added earlier the same day — `signup:127.0.0.1`
had reached five. The limit was working; the test was the thing at fault.

## Live

Deployed 5 November, deployment `80c6e013`. `/account` was `404` before and is
`200` now, and renders the form through the site's own header, theme and
footer.

Against `filemelo.com`:

| | plan | maxFileSizeMb | batch | reason |
|---|---|---|---|---|
| anonymous | free | 100 | 20 | not signed in |
| new account | free | 100 | 20 | no active subscription |

The two reasons differ, which is the part worth noticing: "no active
subscription" is only reachable by looking the account up in D1, so the live
endpoint really is resolving from stored state rather than returning a
constant.

**The paid path was not proved live.** Inserting a synthetic Pro subscription
into the production database was refused as a change to shared data, which is
the right call — writing fake billing rows into production to make a
demonstration work is how real billing state gets corrupted. The Pro
resolution is proved against a real D1 with the same schema and the same code
locally, and the live site is shown to read from the database; what is *not*
shown is the two together. That gap closes the first time a real subscription
exists.

The verification account was deleted afterwards; the live tables are back to
zero rows across accounts, credentials, sessions, subscriptions and attempts.

The rest of the site was checked rather than assumed: `/`, `/tool/merge`,
`/pricing`, `/about` and `/tool/ocr` all 200; the Japanese OCR pack and the
fixed CJK font still serve their exact sizes (2,471,260 and 10,611,296 bytes);
the billing webhook still returns 503 for its missing secret.

## What is still not done

- **`ocrLanguagePacks`, `savedPresets` and `batchQueueSize` are advertised on
  `/pricing` and not enforced.** Only the file-size cap reads the plan so far.
  Saying "entitlement gating is done" would be false; one limit is wired, the
  rest are named here so they are not forgotten.
- **No upgrade path.** `/account` shows the plan and cannot change it, because
  no product exists to buy. `isPurchasable()` is still false for every paid
  plan.
- **No email verification or password reset.** The form says so where someone
  choosing a password will read it, rather than only in a document.
- **Nothing links to `/account` yet** from the header or the tools.
- **Teams has no UI.** Organizations, memberships and invitations are schema
  and resolution logic with no screen.
