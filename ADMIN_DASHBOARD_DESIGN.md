# Workshop CMS Dashboard & Activity Log Design

## Dashboard summary

The CMS overview at `/admin` will read its data from server-side administrator procedures. It will present five small, operational metrics: total registered products, published products, draft products, approved administrators, and pending accounts. The dashboard will also display the latest activity events in reverse chronological order.

| Metric | Source | Meaning |
|---|---|---|
| Registered products | `products` | All product records, regardless of publication state. |
| Published products | `products.publicationStatus` | Records visible on public portfolio routes. |
| Draft products | `products.publicationStatus` | Records still private to the CMS. |
| Approved administrators | `users.role` | Accounts able to use protected CMS procedures. |
| Pending accounts | `users.role` | Signed-in accounts that may be reviewed for administrator approval. |

## Activity record

Activity records are append-only database rows. Each entry stores the server-authenticated actor, an event type, the affected resource, a readable summary, and a small JSON detail object. No sensitive session or credential material is written to the log.

| Event type | Trigger |
|---|---|
| `product.created` | A registry product is created. |
| `product.updated` | Product copy, state, featured status, or ordering is changed. |
| `product.deleted` | A registry product is removed. |
| `product.media_uploaded` | A logo, cover, or screenshot is uploaded. |
| `product.media_removed` | A screenshot is removed. |
| `product.reordered` | Portfolio ordering changes. |
| `site_content.updated` | A site-copy value changes. |
| `user.role_changed` | An account is approved or administrator access is revoked. |

## User-management scope

User management is intentionally constrained to signed-in identities. Accounts appear after their first OAuth sign-in; administrators can then search by name, email, or OAuth identifier and filter by role. The supported management lifecycle is: **read** account information, **create** administrator access by promotion, **update** role state, and **delete** administrator access by demotion.

The project owner, the currently signed-in administrator, and the final remaining administrator cannot be demoted. User identity records are not deleted from the database because they support audit continuity and safe re-approval.
