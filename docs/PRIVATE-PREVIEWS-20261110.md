# Private portal previews

Images with private Drive file IDs load in design cards through the existing authenticated download route. View file opens supported images, PDFs and bounded CSV/text inside the portal; downloading remains optional. No Drive sharing, public file URLs, backend credentials or authorization policies change.

The browser identifies JPEG/PNG/WebP/PDF bytes before assigning their inline type. Text previews are bounded to 512 KiB and use textContent. HTML and SVG are not embedded. Blob URLs exist only in memory and are revoked on project load, tab navigation, sign-out and unmount; pending responses are discarded after identity/project changes. The preview viewer closes with session cleanup.

Validation: 14 service/preview tests and the existing UI regression pass. Tests cover MIME validation, inline image loading, cached viewer reuse, sign-out cleanup, late responses after project switching, PDF viewer creation, literal text rendering and unsupported-type fallback. Portal entry pages revalidate portal JS/CSS with a new asset version. No live authenticated preview or mobile PDF-viewer acceptance is claimed by the offline tests.

## Simple approval states

Selections use yellow Pending, green Approved and red Changes requested, with text labels in EN/ES. Approve submits the existing authenticated design decision directly; Request changes asks only for a note. Saved decisions are loaded through the existing project refresh. Logistics remains separate. Staff see green only after all assigned clients approve; one request for changes makes the summary red, and missing votes stay yellow. No schema or permissions change. These are design selections, not purchase/payment authorizations.
