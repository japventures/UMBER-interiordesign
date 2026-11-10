# Portal workflow implementation

Local review only, on qa/cloud-reconcile-20261110 after QA commit 67564d6. No production writes, migration, push or deployment. Website copy and emoji changes remain separate.

## Implemented

- Fictional demo uses five service stages: site/kickoff, look and feel/layout, conceptual design, budget/purchasing, supervision/styling. Four have fictional dates; supplier-dependent work stays unscheduled. Reference project names, client identities, negotiated amounts and proposal files were not copied.
- Stage view groups project-visible deliverables through data.stage_id and shows their status, attachments and contextual comments. Team-only drafts remain excluded for clients. Existing projects with no linkage render a clear empty state and keep all stages.
- Staff editor supports stage association, current review round, included reviews, duration estimate, prerequisite note and next action in existing data JSON. Validation rejects unrelated stage IDs and invalid review counters. No automatic stage transitions or payment gates.
- Document/design cards show current-version review metadata; updates show next actions. Review rounds are informational staff-entered values, not an immutable approval log or automatic quota.
- Purchasing retains existing row table and selection decisions. Adds a project-visible summary per currency, with ordered/delivered subset and explicit reference-only wording. Missing values are excluded with a count; currencies are never combined. Design approval still does not authorize purchasing or payment.
- Additional responsive CSS wraps the stage detail and budget summary without changing shared website typography.

## Validation and limits

The UI regression covers five stages, linked deliverables and draft isolation, unscheduled work, EN/ES, review counters, escaped metadata, staff save/validation, next actions and mixed-currency summaries. Existing nine offline service tests cover scope, configuration, logout and auth input boundaries. Final commands and results are recorded by the implementation summary.

Visual preview attempted: a local server with browser authentication disabled started successfully, but the cloud browser could not reach it (ERR_CONNECTION_REFUSED). Local/mobile screenshots are not approved. Prior public-demo desktop smoke did not contain these unpublished changes and cannot validate their appearance.

Formal revision history, contract acceptance, purchase authorization, enforced phase/payment dependencies and change-order workflows are not implemented. They require explicit data models and server authorization. Live storage of the new metadata uses the existing JSON data field and existing staff entry save path; actual hosted round-trip and permission tests have not been run. Drive, mail and MFA behavior are unchanged.
