# Zim-PayConnect Project Structure

This document outlines the architectural structure for the Next.js 14 application, specifically designed to support the "Ephemeral Engine" concept where sensitive payroll data is processed in memory and never persisted.

```text
zim-payconnect/
├── app/                                # Next.js 14 App Router
│   ├── (auth)/                         # Authentication Routes (Group)
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── register/
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   ├── (dashboard)/                    # Protected Dashboard Routes (Group)
│   │   ├── page.tsx                    # Dashboard Home (Stats, Quick Actions)
│   │   ├── upload/                     # Payroll Upload Interface
│   │   │   └── page.tsx
│   │   ├── history/                    # Audit Logs / Processing History
│   │   │   └── page.tsx
│   │   ├── settings/                   # Org & User Settings
│   │   │   └── page.tsx
│   │   └── layout.tsx                  # Dashboard Shell (Nav, Sidebar)
│   ├── api/                            # API Routes
│   │   ├── ephemeral/                  # Ephemeral Processing Endpoints
│   │   │   ├── process/
│   │   │   │   └── route.ts            # POST: Upload -> Process -> Return Stream
│   │   ├── rates/                      # Exchange Rate Management
│   │   │   └── route.ts
│   │   └── webhooks/                   # External integrations (e.g., Payments)
│   │       └── pesepay/
│   │           └── route.ts
│   ├── layout.tsx                      # Root Layout
│   └── page.tsx                        # Landing Page
├── components/
│   ├── ui/                             # Reusable UI Components (Shadcn/UI)
│   ├── forms/                          # Upload & Config Forms
│   └── dashboard/                      # Dashboard specific widgets
├── lib/
│   ├── ephemeral-engine/               # CORE LOGIC: In-Memory Processing
│   │   ├── parser.ts                   # CSV Parsing Logic
│   │   ├── validator.ts                # ZIMRA/TaRMS Validation Rules
│   │   ├── calculator.ts               # Tax & Dual Currency Logic (ZiG/USD)
│   │   ├── reconciler.ts               # Dec Reconciliation Logic
│   │   └── types.ts                    # Ephemeral Data Types
│   ├── db.ts                           # Prisma Client Instance
│   ├── auth.ts                         # Auth Configuration
│   └── utils.ts                        # Helper functions
├── prisma/
│   └── schema.prisma                   # Database Schema (Non-PII only)
├── public/                             # Static Assets
├── types/                              # Global Type Definitions
│   └── index.d.ts
├── .env.example                        # Environment Variable Template
├── .eslintrc.json                      # Linting Config
├── .gitignore
├── next.config.mjs                     # Next.js Config
├── package.json                        # Dependencies & Engines
├── postcss.config.js
├── README.md                           # Project Documentation
├── tailwind.config.ts                  # Tailwind Config
└── tsconfig.json                       # TypeScript Config
```
