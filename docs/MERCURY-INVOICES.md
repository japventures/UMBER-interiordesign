# Mercury invoices in the client portal

Prepared, not deployed. Staff publish an invoice entry to its assigned project, attach the privately stored Mercury PDF using the existing authenticated file binding, and set its external link to the actual Mercury-hosted shareable invoice/payment URL. Clients can preview the PDF without downloading it and open Pay in Mercury for outstanding invoices. Paid entries do not offer payment. No fabricated payment URLs or real invoices were created for the simulated project.

Payment links require HTTPS and a mercury.com host or subdomain, without credentials or custom ports. Other hosts and lookalikes are rejected. The existing staff permissions, client project isolation and MFA remain unchanged. Payment happens on Mercury; the portal does not collect bank or card details. Clicking a link never marks an invoice paid.

The team currently verifies payment and records status manually. There is no verified Mercury API connection, webhook or automatic reconciliation. Before enabling real invoices, verify the actual account-generated share-link host, private PDF preview and the payer flow without sending a payment. Do not mark a payment completed based on a return URL.

Official reference: https://support.mercury.com/hc/en-us/articles/29647851492884-Managing-invoices-and-payment-links
