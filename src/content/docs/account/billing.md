---
title: Plans & Billing
description: Free, Pro, and Enterprise — flat $19 Pro with 5 members included, extra seats at +$5/mo, organizations as the billing unit, the 14-day trial, and how quotas are enforced.
---

Kiomon bills **per organization**, not per user. Every account comes with a personal organization (your default workspace container), and you're billed for the organization you're looking at. **Pro is a flat $19/month and includes up to 5 members**; each team member beyond the first 5 adds +$5/month.

There are two self-serve plans — **Free** and **Pro ($19 / month, 5 members included)** — plus a contact-gated **Enterprise** tier for organizations.

## Organizations are the billing unit

- Everyone gets a **personal organization** at signup. Your personal workspaces live inside it, and "your plan" is that org's subscription.
- A **team organization** you create is a separate billing entity — it starts on Free even if you're Pro on your personal org. Upgrade it explicitly (each org is billed independently).
- **Members don't need their own plan.** If you join a team org that's on Pro, you work with full Pro limits inside *its* workspaces, whatever your personal plan is. Your personal org (and personal workspaces) keeps its own plan.
- Spaces resolve to exactly one org, so there's never a "user plan or org plan?" question — it's always "which org is this workspace in?"

## The 14-day Pro trial

Every new account gets a **self-managed Pro trial**:

- Granted automatically at signup — **no card required**
- You're treated as Pro for 14 days (status `trialing`)
- When the window closes you *fall back to Free* automatically — nothing is deleted, you just lose Pro capabilities
- If you upgrade (or cancel) mid-trial, the trial flag becomes inert and billing takes over

## The plan comparison

Limits apply per **billing entity** (a personal org, or a team org summed across its workspaces).

| Capability | Free | Pro (incl. trial) | Enterprise |
|---|---|---|---|
| Price | $0 | **$19 / month (5 members included)** | Custom (contact) |
| Org members | up to 5 | 5 included, then +$5 / member / month | unlimited |
| Max documents | 3,000 | 150,000 | 1,000,000 |
| Weekly documents | 500 | 30,000 | 1,000,000 |
| Daily documents | 120 | 6,000 | 200,000 |
| Storage | 300 MB | 15 GB | 100 GB |
| Workspaces | 5 | 50 | 500 |
| API keys | 2 | 25 | 50 |
| Connectors | ❌ | 300 | 1,000 |
| **Auto-linking (knowledge graph suggestions)** | ❌ | ✅ | ✅ |
| Manual document linking | ✅ | ✅ | ✅ |
| **Daily AI budget (tokens, all surfaces)** | 100K | 2.5M | effectively unlimited |
| **Per-turn AI context cap (tokens)** | 20K | 80K | effectively unlimited |
| Agent chat turns / day | 20 | 400 | Same as Pro |
| RAG asks / day | (capped) | 25× Free | Same as Pro |
| Search queries / day | (capped) | 5,000 | Same as Pro |
| OpenAI-compatible chat / day | 30 | 2,000 | Same as Pro |
| OpenAI-compatible embeddings / day | 200 | 10,000 | Same as Pro |

## Seats

Pro is a **flat $19/month** that **includes up to 5 active members**. A team org seats every active member, so the first 5 cost nothing extra — only membership beyond that is billable.

- **5 seats included** — your personal org is one of them; a 2–5 person team org pays the same flat $19 as a solo user.
- **Extra seats** — when upgrading you can add seats beyond the 5 included (e.g. +5, +10, +25) at **+$5/month each**; the seat add-on is part of the same checkout. On an existing Pro org, admins adjust extra seats right from **Settings → Organization** and the change is billed from the next renewal.
- **Adding members** — inviting someone beyond your seat capacity is **blocked** until you add more seats (the invite shows an "add seats / upgrade" message). No surprise overage charges.
- **Removing a member frees their seat immediately** — no proration math.
- **Free orgs** hold up to 5 members; the 6th invite is blocked with an upgrade prompt.
- Legacy Pro orgs that predate seat pricing keep unlimited capacity until an admin adds seats.

## The Enterprise tier

Enterprise is a **contact-gated** plan — there is no self-serve checkout. Teams and agencies that need scale talk to sales and get a tailored package: per-client isolated workspaces, team SSO/SAML, dedicated storage & data retention policies, high-throughput MCP concurrency, dedicated support with an SLA, and custom onboarding. Quotas are effectively unlimited (the table above is the hard ceiling, not a wall you'll hit).

- **Assignment** — Enterprise is provisioned by the Kiomon team on your account (sales-assigned; it is never purchased through the checkout).
- **Billing** — custom terms agreed with sales, separate from the monthly Pro cycle.
- **Contact** — reach us via the [contact page](/contact) or the dashboard's *Contact Sales* card under Billing.

## How quotas are enforced

Quotas are enforced on **every write path**, not just in the UI — the API, MCP, extension, and dashboard all share the same rules:

1. **Your effective plan** is derived from the workspace's org subscription (or your personal org's) — never from a member's own subscription.
2. **Usage counters** — totals (total/weekly/daily/storage) aggregate across the billing entity's workspaces and are checked before every ingest.
3. **Storage gate** — updates that grow your library are checked too.
4. **Capability + member gates** — connectors (Pro-only), API keys, workspaces, auto-linking, and org member seats are checked at creation/invite time.

### AI usage is token-metered, not just request-capped

Counting requests (turns/day) only bounds *how often* you can ask — but LLM cost scales with the *context*, so Kiomon also meters **tokens** against a daily budget shared by every AI surface (agent chat, Q&A, the OpenAI-compatible API, and briefings):

- **Org-aware** — a chat inside an org workspace draws from the **org's** budget (all members share one pot, matching how plans resolve); your personal workspaces draw from your personal org's budget.
- **Pre-flight gate** — before a turn starts, the estimated prompt is checked against the remaining budget (fast 402/429 instead of a doomed stream); the agent loop re-checks before *every* Gemini step, so a runaway tool loop can't outspend the day.
- **Real metering** — the model's actual token counts are recorded after every turn; the meter in **Settings → Usage** shows used/remaining with a `tokens/day` budget.
- **Upgrade friction, not punishment** — Free is generous for real use (≈100K tokens/day ≈ 20 typical agent turns) but a hard wall for abuse; Pro gets 25× and Enterprise is effectively unlimited.

You'll never silently lose data: hitting a cap returns a specific message (e.g. "Weekly document limit of 500 reached. Upgrade to Pro to remove this cap.") and the dashboard surfaces an *Upgrade required* dialog.

## Usage visibility

The dashboard shows live usage (documents, storage, AI budget) in **Settings → Usage**, seat/member capacity and the plan card under **Settings → Organization**, and historical metrics on the **Insights** page.

## Upgrading / managing the subscription

Billing runs on **Dodo Payments**, per organization:

- **Checkout** — the dashboard opens a hosted checkout for the flat $19 Pro subscription (5 members included) with an optional extra-seat add-on. After payment, the org's plan flips to Pro immediately.
- **Portal** — manage, upgrade, downgrade, or cancel from the customer portal. A downgrade keeps access until the period ends; invites are blocked while over the Free member cap.
- **Status** — `GET /api/billing/subscription` returns your personal org's plan, status, and period end; `GET /api/orgs/:id/billing` returns the same for any org you admin, plus `seats` and `members` for the capacity meter.
- **Verification** — checkout returns are verified server-side before your plan updates.