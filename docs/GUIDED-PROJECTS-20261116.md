# Guided project setup — implementation and rollout

## Implemented

Staff Project setup presents Proposal, Agreement/kickoff, Site survey, Design, Technical design, Budget/procurement, Construction/installation, and Handover. Deliverables have fixed semantic keys. Design order is 2D drawings, 3D model/tour, moodboard, renderings. New project creation prepares generic stages automatically. Repeated preparation preserves successful stages and existing legacy content.

A guided upload form supplies slot, kind, category, title, version, stage and position automatically. Staff choose one file and optionally enter a room and note. New files are private drafts; a separate publish action shares them with assigned clients. Contract upload is recordkeeping for an externally signed document, not electronic signature, legal acceptance or automated email. Stage completion is still confirmed by staff. Existing projects are not automatically reclassified.

Private upload is implemented in portal-drive: staff + validated AAL2 required; published records cannot be overwritten; supported binary signatures and a 25 MB limit; server-side Drive credentials; folder bound to the entry's project under the existing portal root; attachment update uses optimistic timestamp matching. No sharing changes, secret values, RLS changes or SQL migrations. Unbound files/folders can remain after a failed concurrent save; no automatic deletion. GLB/ZIP files can be stored/downloaded but the existing viewer only previews supported images/PDF/text.

## Deployment state

Frontend workflow may be published to the test site for review. General upload is NOT yet enabled in live mode. The service has NOT been deployed or verified against Drive. The dashboard currently requires sign-in. Live upload requires all of:

1. Reconcile hosted portal-drive with this repository version; deploy the reviewed update without changing JWT/MFA or OAuth settings.
2. Test a synthetic staff-AAL2 upload into a synthetic project; verify download/preview and that a client cannot upload or read a private draft or another project's file.
3. Enable `guidedUploadEnabled: true` in the portal public configuration only after successful checks. This flag grants no server privileges; it only enables UI.

Until then live guided attachment opens an explicit setup-pending message and creates no record. Demo mode simulates metadata only and explicitly says no file was uploaded. Existing preview/download and other admin editors remain available.

## Validation

130 Node tests pass, including ordered template, partial initialization retry, upload AAL1/non-staff/published-record denial, MIME rejection, bound upload metadata and private preview/project-isolation regressions. Browser review and actual service deployment results must be tracked separately; mocks are not a live integration test.
