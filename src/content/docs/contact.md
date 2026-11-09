---
title: Contact & Support
description: Where to get help with Kiomon — technical support, sales and licensing, and security reports.
---

Kiomon's support is handled by the team directly. The fastest route is the contact form on the
main site:

<LinkCard
	title="Contact Kiomon"
	description="Open the contact form at kiomon.com/contact"
	href="https://kiomon.com/contact"
/>

You can also write to [support@kiomon.com](mailto:support@kiomon.com).

## Which route to use

| You need | Choose | Typical cases |
|---|---|---|
| Help using the product | **Technical Support** | A save that never finished, an agent that will not connect, a quota you believe is wrong, data export or deletion |
| Team plans, invoicing, procurement | **Sales & Licensing** | Seats, custom terms, SSO, data-retention agreements, paperwork |
| A vulnerability report | **Security report** | Anything that could put someone's data at risk — see [Security](https://github.com/kiomon-hq/docs/blob/main/SECURITY.md) |

Enterprise is provisioned by the team rather than bought from a checkout, so sales is also the
route for a plan change that the dashboard's *Contact Sales* card opens — see
[Plans & Billing](/account/billing).

## Before you write

Include the thing that lets someone reproduce what you saw:

- **API** — the request (method and path), the HTTP status, and the `code` field from the error
  body. The codes are listed in the [REST API reference](/reference/api) and
  [Errors & Retries](/sdk/errors).
- **MCP or an agent client** — which client, which tool, and the workspace id you were pointing at.
  A `401` usually means the key, not the tool.
- **Ingest** — the filename, the size, and what `GET /api/documents/:id/job` reports for the
  document. [The Ingest Contract](/reference/ingest) explains each state.
- **Billing** — the organization name and the email on the account.

Never send an API key, a signing secret, or a document's contents in a support request. If a
problem needs one of those to reproduce, say so first and Kiomon will tell you how to share it
safely.
