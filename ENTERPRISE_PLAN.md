# Enterprise Implementation Plan

This document outlines the technical roadmap to fully implement the advertised "Enterprise" features: **Private Instance**, **Custom Integrations**, **SLA Assurance**, and **Dedicated Account Manager**.

## Phase 1: Governance & Support (Dedicated Account Manager)
**Goal:** Operationalize the "Dedicated Account Manager" feature.

### Technical Implementation
1.  **Schema Update (`prisma/schema.prisma`):**
    *   Add `role` enum value `SUPPORT_AGENT`.
    *   Add `accountManagerId` to the `Organization` model (Relation to `User`).
2.  **Admin Dashboard (`/admin`):**
    *   Create a protected route accessible only by `ADMIN` and `SUPPORT_AGENT` roles.
    *   **Features:**
        *   List all Enterprise/Agency organizations.
        *   Assign an internal user (Account Manager) to an organization.
        *   "Impersonate" feature: Allow Account Managers to view the dashboard *as* the client to troubleshoot issues.
3.  **Client Dashboard Update:**
    *   Display the Account Manager's contact info (Name, Email, Phone) prominently in the "Help" or "Settings" section for Enterprise users.

## Phase 2: Connectivity (Custom Integrations)
**Goal:** Enable "Custom Integrations" via a robust API and Webhook system.

### Technical Implementation
1.  **API Key Management:**
    *   Add `ApiKey` model to Prisma (hashed key, scopes, lastUsed, expiresAt).
    *   Create "Developer Settings" page for Enterprise users to generate/revoke keys.
    *   Implement API Middleware to authenticate requests using `Authorization: Bearer <api_key>`.
2.  **Webhooks System:**
    *   Add `WebhookEndpoint` model (url, secret, events, active status).
    *   Implement an event bus (e.g., using Redis or internal EventEmitter) to trigger webhooks on key actions (e.g., `payroll.processed`, `report.generated`).
    *   Build a retry mechanism for failed webhook deliveries.
3.  **Documentation:**
    *   Auto-generate Swagger/OpenAPI docs for the external-facing API.

## Phase 3: Reliability & Trust (SLA Assurance)
**Goal:** Provide tangible proof of "SLA Assurance".

### Technical Implementation
1.  **Uptime Monitoring Integration:**
    *   Integrate a status page (e.g., BetterStack, Atlassian Statuspage) or build a simple internal health check endpoint (`/api/health`).
2.  **SLA Reporting:**
    *   Create a scheduled job (Cron) to generate a monthly "Service Level Report" PDF.
    *   **Metrics to Track:**
        *   System Uptime (99.9% target).
        *   Average API Response Time.
        *   Support Ticket Resolution Time (if helpdesk integrated).
    *   Email this report automatically to Enterprise admins.

## Phase 4: Data Sovereignty (Private Instance)
**Goal:** Deliver "Private Instance" capabilities without managing separate codebases.

### Technical Implementation
1.  **Database Isolation (Multi-Tenancy Strategy):**
    *   **Level 1 (Logical - Current):** Data separated by `organizationId`.
    *   **Level 2 (Physical Database - Recommended):** 
        *   Create a "Catalog" database that maps `hostname` or `organizationId` to a specific `DATABASE_URL`.
        *   Update `PrismaClient` initialization to dynamically connect to the correct database based on the request context.
2.  **Infrastructure Automation:**
    *   Create a Terraform/Pulumi script to provision a dedicated RDS/Postgres instance for a new Enterprise client.
    *   (Optional) Dockerize the application to allow deploying a dedicated container cluster for the client (Extreme Isolation).

## Summary Roadmap

| Feature | Phase | Est. Effort | Priority |
| :--- | :---: | :---: | :---: |
| **Dedicated Account Manager** | 1 | Low | High |
| **Custom Integrations (API)** | 2 | Medium | High |
| **SLA Assurance (Reports)** | 3 | Medium | Medium |
| **Private Instance (DB)** | 4 | High | Low |
