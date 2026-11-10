# Portal requirements from supplied design references

Status: incorporation plan only. No application changes, database changes, deployments or real client content are included. Based on two user-supplied PDF references reviewed 10 November 2026. Project identities, fees, payment schedules, signatures, contact details and private assets must not become public demo data. Source PDFs remain private.

## Coordination

The website-document review owns duplicate page content, public project descriptions, heading color and studio copy. The separate emoji task owns icon/text substitutions. This plan covers only how the portal can represent the supplied service workflow and presentation. It must be reviewed alongside those patches before implementation. The source's conceptual design service is a real phase; removing a public navigation label named Concepto does not authorize deleting that phase from service workflows.

## Incorporation matrix

| Requirement | Existing support | Prepared change and acceptance |
| --- | --- | --- |
| Warm branded, editorial presentation | portal.css and shared typography/colors | Reuse the existing verified brand tokens. Large editorial headings should follow the requested logo color once the website review settles its exact token. Avoid inventing a font from the PDF; obtain licensed source fonts before introducing them. |
| Five design/execution stages | portal_entries kind stage, starts_at/ends_at; calendar/Gantt | Offer an optional reusable stage template: site visit/start, look and feel/distribution, conceptual design, budget/purchasing, supervision/styling. Preserve existing project stages; do not auto-replace them. Use fictional demo names/data. |
| Estimated time versus scheduled date | Calendar/Gantt already show unscheduled records | Treat reference durations as estimates, not a committed schedule or universal defaults. A provider-dependent stage stays unscheduled until staff supplies dates; display the dependency rather than inventing completion dates. |
| Stage deliverables | Documents, design entries and stage records | Associate layouts, materials, lighting, renders and walkthroughs with a stage. Staff must explicitly publish each deliverable; team-only stays the default. Missing assets show a useful empty state. |
| Review rounds and written approvals | Selection decisions and contextual comments | Show requested revision rounds and version history per deliverable as a future explicit data feature. Existing design approval is not payment, purchase authorization or contract acceptance. Do not relabel it as any of these. |
| Conceptual phase prerequisite before executive work | Stage status exists; no verified payment gate | Prepare a staff-visible checklist for design approval and settlement confirmation. Do not infer a paid invoice from a design decision or automatically open the next phase. A future enforced dependency needs separate schema/permission design. |
| Budget by line item and purchasing | Selections and invoices sections | Retain the table direction owned by the document review. Distinguish proposal, design decision, purchase authorization, ordered and delivered. Do not silently turn a click on approved into a purchase. |
| Changes to scope, fees and schedule | Comments exist; no formal change-order model | Future change requests must retain request, impact, approval author/time and version. Requires a reviewed model before implementation; no contractual claims based only on comments. |
| Communication and next actions | Overview, updates and messages | Expose next action, responsible party and dated update when supplied. Do not infer notifications or email delivery from an in-portal comment. |
| Private proposal and terms | Project entries and private Drive download path | Store the actual proposal/terms only as project-restricted files. Do not copy legal terms, client names or negotiated figures into public source/demo fixtures. |

## Implementation order

1. Integrate the independent website and emoji patches after their validation; keep private content outside the repository.
2. Add a fictional five-stage template as an optional staff action, preserving current projects and publication defaults. Cover unscheduled/provider-dependent stages and client/team visibility.
3. Improve stage-to-deliverable navigation and missing-asset states using existing fields where sufficient. Confirm whether a new relation is needed before changing schema.
4. Design explicit versioned approvals, revision rounds, purchase authorization and change requests separately. These are new business features, not text substitutions. Review permissions and migration requirements before implementing.
5. Validate EN/ES, mobile, keyboard use, staff-only drafts and project scope. Live authorization tests still require approved synthetic identities and MFA.

## Source limitations

Full parsed text was available for both PDFs. The first reference contains screenshot annotations; page-image pointers were returned, but their rendered pixels were not materialized for this review. The proposal's second page image was unavailable from the reader. Exact visual comparison is therefore left to the coordinating document review. No claim of pixel matching or complete design acceptance is made.
