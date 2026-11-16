# Separate purchases and construction costs

Published to the authorized test site. No source workbook contents, customer information, source images, fees or real order numbers were copied to the repository. No database schema, RLS, MFA, credentials, DNS or domain changes.

## Purchases

Existing selection records retain their approval decisions, visibility and attachment references. The control adds grouping, per-unit discount, confirmed subtotal, tax, delivery, reported commission, order reference, delivery estimate and independent procurement tracking. Calculated subtotal is (unit price - per-unit discount) × quantity. Confirmed subtotal and quoted total take precedence. Commission is separate, never silently added. Shared shipping/tax must be allocated or entered once; group charges are not inferred from the source workbook. Missing extras do not become zero.

## Construction costs / Memorias de obra

Uses existing `update` records with `data.category = work_budget` and non-negative nullable budget/actual values. It is separate from the photo/weekly-expense log. Variance is actual - budget. Positive is over budget; negative is available budget, not a guaranteed saving. Comparison summaries include only complete pairs with a supported currency, separated by currency. Weekly reports are not added again. Existing client/team visibility and project scoping apply.

No automatic synchronization with the source spreadsheet, suppliers, bank or accounting system was created. Staff enter/update the records; client visibility still requires publication by staff. No live financial records were imported or modified.

## Validation

126 Node tests passed, covering calculations, explicit zeros, missing actual values, discount limits, decimal rounding, existing approvals, project isolation and private previews. Published browser checks use fictional demonstration data only. Authenticated persistence to Supabase remains untested in this release.
