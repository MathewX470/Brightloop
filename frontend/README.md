# ⚡ Brightloop — Unified B2B Subscription & Recurring Billing Platform

Brightloop is an enterprise-grade B2B Subscription Lifecycle Management, Automated Recurring Billing, and Smart Dunning Platform with native AI intelligence. Built with **Next.js 16 (App Router)**, **Tailwind CSS v4**, **Prisma ORM**, **Neon Serverless PostgreSQL**, and **Groq LLM Acceleration**.

---

## 🌟 Comprehensive Feature Catalog

### 1. 💼 Subscription & Contract Lifecycle
- **Flexible Billing Cycles**: Native support for Monthly, Quarterly, Semi-Annual, and Annual billing schedules.
- **Multi-Line Item Subscriptions**: Attach multiple products, plans, add-ons, and seat quantities to a single subscription.
- **Lifecycle Status State Machine**: Automated transitions between `ACTIVE`, `PAUSED` (delinquent/dunning), `CANCELLED`, and `EXPIRED`.
- **Quotations & Template Engine**: Reusable quotation templates (`/templates`) that convert directly into active customer subscriptions upon digital signing or approval (`/my-quotations`).

### 2. ⚡ Automated Recurring Billing & Proration
- **Idempotent Recurring Billing Worker**: Scans active subscriptions due for renewal, prevents duplicate charges via idempotency keys, and generates recurring invoices with tax and discounts pre-computed.
- **Autonomous Background Execution**: Evaluates active subscriptions and dunning queues every 60 seconds in the background with zero manual intervention required.
- **Worker Audits & Execution Logs (`/billing-events`)**: Full visibility into batch operations, filterable by all executions, billing runs, and dunning email dispatches.

### 3. 🚨 3-Stage Smart Dunning Engine
- **Stage 1 (Days 1–6 Overdue — Courtesy Period)**: Automated friendly payment reminder emails dispatched via Nodemailer with direct checkout links ($0 surcharge).
- **Stage 2 (Days 7–9 Overdue — Late Fee Penalty)**: Automatic 5% late fee surcharge applied to outstanding invoice balances, accompanied by an urgent overdue notification.
- **Stage 3 (Days 10+ Overdue — Service Suspension)**: Subscription status automatically toggled to `PAUSED` and an account suspension notice is sent to protect business cash flow.
- **Daily Idempotency Lock**: Built-in verification preventing duplicate reminder emails from being sent to customers on the same day.

### 4. 🤖 AI Support & Revenue Intelligence
- **AI Customer Support Assistant**: Embedded floating assistant in the Customer Portal powered by Groq (`openai/gpt-oss-120b`). Queries real-time database context (active plans, renewal dates, outstanding invoices, dunning rules) to answer customer queries with sub-second response times and strict guardrails against off-topic questions.
- **AI Churn Prediction & Retention Engine**: Evaluates payment lag, overdue history, and subscription tenure to score customer churn risk (0–100%) and suggest proactive retention strategies on the Admin Dashboard.

### 5. 💳 Payments, Taxes & Catalog Management
- **Razorpay Payment Gateway**: Seamless order creation, checkout modal integration, and server-side HMAC-SHA256 signature verification.
- **Catalog & Pricing Management**: Full CRUD for Products (`/products`), Pricing Plans (`/plans`), Tax Rates (`/taxes`), and Promotional Discounts (`/discounts`).
- **Invoice & Payment Tracking**: Admin and customer views for invoices (`/invoices`, `/my-invoices`) and transaction records (`/payments`, `/my-payments`).

### 6. 🔐 Enterprise Authentication & RBAC
- **Edge-Compatible Middleware**: Custom HMAC-authenticated cookie session guards protecting administrative routes (`/dashboard`, `/staff`, `/billing-events`) from customer access.
- **Staff & Role Management (`/staff`)**: Distinction between `ADMIN`, `STAFF`, and `CUSTOMER` roles.
- **Complete Auth Flow**: Login, customer signup with password complexity validation, forgot password with secure email tokens, password reset, and logout.

---

## 🏗️ System Architecture & Workflows

### 1. Recurring Billing & 3-Stage Dunning Workflow

```mermaid
flowchart TD
    A[Autonomous Background Worker] --> B[Query Active Subscriptions]
    B --> C{Next Billing Date <= Today?}
    C -- Yes --> D[Generate Recurring Invoice]
    D --> E[Log Event: BATCH_BILLING_CYCLE]
    C -- No --> F[Skip to Overdue Audit]
    E --> F
    
    F --> G[Query Confirmed Unpaid Invoices]
    G --> H{Calculate Days Overdue}
    
    H -- "Days 1 - 6" --> I[Dispatch Friendly Reminder Email]
    I --> J[Log Event: DUNNING_REMINDER_EMAIL_SENT]
    
    H -- "Days 7 - 9" --> K[Apply 5% Late Surcharge Fee]
    K --> L[Dispatch Urgent Late Surcharge Email]
    L --> M[Log Event: DUNNING_LATE_FEE_EMAIL_SENT]
    
    H -- "Day 10+" --> N[Update Subscription Status to PAUSED]
    N --> O[Dispatch Service Suspension Email]
    O --> P[Log Event: DUNNING_SUSPENSION_EMAIL_SENT]
    
    H -- "0 Days / Settled" --> Q[No Action Needed]
```

---

### 2. Context-Injected AI Customer Chatbot Workflow

```mermaid
sequenceDiagram
    autonumber
    actor Customer as Logged-in Customer
    participant UI as Customer Portal (/portal)
    participant API as /api/portal/chat
    participant DB as Neon PostgreSQL (Prisma)
    participant AI as Groq LLM (GPT-OSS-120B)

    Customer->>UI: "When is my next renewal and do I have any unpaid bills?"
    UI->>API: POST { message, history }
    API->>DB: Query User -> Customer -> Active Subscriptions & Invoices
    DB-->>API: Returns plan names, renewal dates, outstanding balances
    API->>API: Construct System Prompt with live customer profile & strict guardrails
    API->>AI: Send Chat Completion Request (~80ms latency)
    AI-->>API: Return concise, polite markdown answer with exact customer data
    API-->>UI: Return JSON { reply }
    UI-->>Customer: Render response in floating support modal
```

---

### 3. Role-Based Access Control (RBAC) Architecture

```mermaid
flowchart LR
    Visitor[User / Visitor] --> Auth{Authenticate}
    
    Auth -- Role: CUSTOMER --> Portal[Client Portal: /client/*]
    Portal --> P1[Dashboard Overview]
    Portal --> P2[My Subscriptions & Quotations]
    Portal --> P3[My Invoices & Razorpay Checkout]
    Portal --> P4[AI Support Chatbot]
    
    Auth -- Role: ADMIN / STAFF --> Admin[Admin ERP: /dashboard]
    Admin --> A1[MRR & ARR Analytics]
    Admin --> A2[AI Churn Predictor]
    Admin --> A3[Worker Operations: /billing-events]
    Admin --> A4[Catalog: Products, Plans, Taxes, Discounts]
    Admin --> A5[Customers & Staff Management]
```

---

## 💻 Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend Framework** | Next.js 16 (App Router) | Server Components, Client Hooks, Dynamic Routing |
| **Styling** | Tailwind CSS v4, Lucide Icons | Responsive modern enterprise styling |
| **Database & ORM** | Neon PostgreSQL, Prisma 6.19 | Serverless connection pooling, typesafe queries |
| **Artificial Intelligence** | Groq API (`openai/gpt-oss-120b`) | Support chatbot & churn retention recommendations |
| **Email Service** | Nodemailer (Gmail SMTP) | Transactional auth & automated dunning notifications |
| **Payment Gateway** | Razorpay SDK | Order creation, payments, signature verification |
| **Unit Testing** | Vitest | Validation for auth, billing, and subscriptions |
| **Package Management** | `pnpm` | Reliable dependency resolution and lockfile |

---

## 📁 Repository Directory Structure

```
Brightloop/
├── frontend/
│   ├── prisma/
│   │   └── schema.prisma             # 22 Database models (Customer, Plan, Subscription, Invoice, etc.)
│   ├── src/
│   │   ├── app/
│   │   │   ├── (admin)/              # Admin ERP Console
│   │   │   │   ├── dashboard/        # Churn predictor, MRR metrics, auto-worker card
│   │   │   │   ├── billing-events/   # Background worker audits, execution logs & filters
│   │   │   │   ├── customers/        # Customer directory & profile management
│   │   │   │   ├── subscriptions/    # Subscription contract oversight
│   │   │   │   ├── invoices/         # Invoice creation, status filters, payment logging
│   │   │   │   ├── payments/         # Payment history & transaction reconciliation
│   │   │   │   ├── products/         # Product catalog management
│   │   │   │   ├── plans/            # Subscription pricing plan tiers
│   │   │   │   ├── discounts/        # Promotional coupon codes & discounts
│   │   │   │   ├── taxes/            # Regional tax rates & calculation rules
│   │   │   │   ├── templates/        # Reusable quotation templates
│   │   │   │   └── staff/            # Staff user directory & role management
│   │   │   ├── (portal)/             # Customer Self-Service Portal
│   │   │   │   └── client/
│   │   │   │       ├── dashboard/    # Customer dashboard & quick stats
│   │   │   │       ├── my-subscriptions/ # Active plans, renewals & cancellation
│   │   │   │       ├── my-invoices/  # Unpaid & historical invoices with pay links
│   │   │   │       ├── my-quotations/# Draft quotations with digital signing
│   │   │   │       └── profile/      # Customer contact & billing address
│   │   │   ├── (auth)/               # Login, Signup, Forgot Password, Reset Password
│   │   │   └── api/                  # Edge & Serverless REST API endpoints
│   │   │       ├── admin/billing/run # Master billing batch & dunning trigger
│   │   │       ├── admin/analytics/  # AI Churn Prediction engine
│   │   │       ├── portal/chat/      # Contextual Groq support chatbot
│   │   │       └── portal/payments/  # Razorpay checkout & payment verification
│   │   ├── components/
│   │   │   ├── portal/               # CustomerChatWidget, PortalLayout, PortalSidebar
│   │   │   ├── layout/               # Topbar, Sidebar, shared navigation
│   │   │   └── shared/               # StatusBadge, Button, Input, Modal components
│   │   ├── modules/
│   │   │   ├── billing/              # runBillingBatch, runDunningEngine, generateInvoice
│   │   │   └── auth/                 # Session verification & password hashing
│   │   ├── lib/
│   │   │   ├── db.ts                 # Prisma Client singleton
│   │   │   ├── email.ts              # Nodemailer SMTP transporter
│   │   │   └── razorpay.ts           # Razorpay client & HMAC signature verifier
│   │   └── middleware.ts             # Web Crypto Edge route protection & RBAC guards
│   └── tests/                        # Vitest automated test suites (8/8 tests passing)
└── README.md
```

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js (v18.x or v20.x+)
- pnpm (`npm install -g pnpm`)
- PostgreSQL database (or Neon serverless instance)

### 2. Environment Configuration
Create a `.env` file in the `frontend/` directory:

```env
# Database Connection (Neon PostgreSQL)
DATABASE_URL="postgresql://user:password@ep-still-water.neon.tech/neondb?sslmode=require"

# Application URL & Auth Secret
NEXTAUTH_URL="http://localhost:3000"
SESSION_SECRET="your-super-secret-random-key"

# Email Configuration (Nodemailer SMTP)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=465
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-gmail-app-password"
EMAIL_FROM="\"Brightloop Billing\" <your-email@gmail.com>"

# AI Support & Churn Analytics (Groq API)
GROQ_KEY="gsk_your_groq_api_key_here"

# Payment Gateway (Razorpay)
RAZORPAY_KEY_ID="rzp_test_xxxxxx"
RAZORPAY_KEY_SECRET="your_razorpay_secret"
```

### 3. Installation & Database Migration
```bash
# Install dependencies using pnpm
npx pnpm install

# Generate Prisma client bindings
npx pnpm prisma generate

# Apply migrations / sync schema
npx pnpm prisma db push
```

### 4. Running the Development Server
```bash
npx pnpm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Running the Automated Test Suite
```bash
npx pnpm test
# or
npx vitest run
```

---

## 🛡️ Hackathon Evaluation Checklist

| Category | Feature | Status | Notes |
|---|---|---|---|
| **Billing Engine** | Recurring Billing Batch | ✅ Complete | Dynamic interval renewals with idempotency protection |
| **Dunning Engine** | 3-Stage Smart Dunning | ✅ Complete | Day 1-6 reminder $\rightarrow$ Day 7 +5% late fee $\rightarrow$ Day 10 pause |
| **Notifications** | Transactional Emails | ✅ Complete | Real Gmail SMTP dispatch for dunning & auth |
| **Artificial Intelligence** | Customer Support Chatbot | ✅ Complete | Groq `openai/gpt-oss-120b` with live DB context injection |
| **Artificial Intelligence** | Churn Risk Predictor | ✅ Complete | Real-time risk scoring and mitigation strategies on dashboard |
| **Worker Operations** | Execution Audit Log | ✅ Complete | Real-time filterable log at `/billing-events` |
| **Payments** | Payment Gateway | ✅ Complete | Razorpay order creation & HMAC verification |
| **Catalog** | Products, Plans, Taxes, Discounts | ✅ Complete | Full CRUD with multi-tier pricing |
| **Security & RBAC** | Edge Auth Guards | ✅ Complete | Role-segregated navigation with bcrypt password security |
| **Code Quality** | Automated Test Coverage | ✅ Complete | 8/8 Vitest tests passing |

---

## 📄 License
This project is developed under the MIT License for Hackathon 2026.
