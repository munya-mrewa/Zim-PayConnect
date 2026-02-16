# Zim-PayConnect: Ephemeral Payroll Engine

## 🚀 Overview
**Zim-PayConnect** is a specialized SaaS platform designed to solve compliance challenges for ZIMRA's (Zimbabwe Revenue Authority) 2025-2026 TaRMS payroll framework.

It features a unique **Ephemeral Engine** architecture. Unlike traditional payroll systems, Zim-PayConnect **does not store employee data**. It acts as a secure, volatile processing pipe:
1.  **Ingest:** Raw payroll CSVs are uploaded into secure RAM.
2.  **Process:** Data is validated, tax logic (FDS/Non-FDS) is applied, and dual-currency (ZiG/USD) calculations are performed in-memory.
3.  **Output:** Compliant tax returns and reports are streamed back to the user.
4.  **Destroy:** All PII (Personal Identifiable Information) is immediately purged from memory.

This "Zero-Persistence" approach eliminates GDPR/Data Protection liabilities for the platform while ensuring strict compliance with ZIMRA's complex dual-currency rules.

## 🛠 Tech Stack

*   **Framework:** [Next.js 14](https://nextjs.org/) (App Router)
*   **Language:** TypeScript
*   **Database:** PostgreSQL (Metadata, Auth, & Audit Logs ONLY)
*   **ORM:** [Prisma](https://www.prisma.io/)
*   **Deployment:** VPS via [Dokploy](https://dokploy.com/)
*   **Build Environment:** [Nixpacks](https://nixpacks.com/)

## ⚙️ Prerequisites

*   **Node.js:** v20.0.0 or higher (Strict requirement for Nixpacks)
*   **PostgreSQL:** Database instance ready.

## 🏗 Architecture & The Ephemeral Engine

### Core Principles
1.  **Zero-Persistence PII:** The database schema explicitly excludes tables for Employees, Salaries, or Payslips.
2.  **Volatile Processing:** All parsing and calculation happen within the request lifecycle (or background workers) using only volatile memory.
3.  **Strict Audit Trails:** We log *who* processed a file and *when*, but never *what* was inside specific rows.

### Directory Structure Highlights
*   `/lib/ephemeral-engine`: Contains the isolated business logic for ZIMRA tax rules.
*   `/app/api/ephemeral`: API routes that handle file streams.
*   `/prisma/schema.prisma`: Schema definitions for non-sensitive data (Users, Orgs).

## 🚀 Deployment (Dokploy & Nixpacks)

This project is configured for deployment on a VPS using Dokploy with Nixpacks.

### 1. Nixpacks Configuration
The `package.json` includes the `engines` field to ensure the correct Node.js version is used during the build:

```json
"engines": {
  "node": ">=20.0.0"
}
```

### 2. Environment Variables
Copy `.env.example` to `.env` and configure your secrets.

```bash
cp .env.example .env
```

**Required Variables:**
*   `DATABASE_URL`: Connection string for PostgreSQL.
*   `NEXTAUTH_SECRET`: Secret for session signing.
*   `NEXTAUTH_URL`: Canonical URL of the site.

### 3. Database Migration
Run migrations to set up the metadata tables.

```bash
npx prisma migrate deploy
```

## 🇿🇼 Domain Logic (TaRMS 2025/2026)

The engine handles specific Zimbabwean tax requirements:
*   **FDS vs. Non-FDS:** Splits mixed CSVs into Final Deduction System (Permanent) and Non-FDS (Casual) reports.
*   **Dual Currency:** Simultaneous calculation of ZiG and USD taxes.
    *   *Thresholds:* ZiG 2,800.00 | USD 100.00
    *   *Max Rate:* 40%
*   **December Reconciliation:** specialized logic to ingest 11 months of history (in-memory) to generate year-end adjustment files.

## 🤝 Contributing

1.  Clone the repository.
2.  Install dependencies: `npm install`
3.  Run development server: `npm run dev`

---
*Built for ZIMRA Compliance.*
