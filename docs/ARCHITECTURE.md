# Kredio Architecture v1.0.0

Technical reference for the Kredio credit management platform.

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Project Structure](#2-project-structure)
3. [Backend Architecture](#3-backend-architecture)
   - 3.1 [Entry Point & Bootstrap](#31-entry-point--bootstrap)
   - 3.2 [Configuration Layer](#32-configuration-layer)
   - 3.3 [Shared Layer](#33-shared-layer)
   - 3.4 [Module System](#34-module-system)
   - 3.5 [Request Lifecycle](#35-request-lifecycle)
4. [Database Schema](#4-database-schema)
   - 4.1 [Entity Relationship Diagram](#41-entity-relationship-diagram)
   - 4.2 [Models Detail](#42-models-detail)
   - 4.3 [Enums & Constraints](#43-enums--constraints)
5. [API Reference](#5-api-reference)
   - 5.1 [Auth Endpoints](#51-auth-endpoints)
   - 5.2 [Client Endpoints](#52-client-endpoints)
   - 5.3 [Credit Endpoints](#53-credit-endpoints)
   - 5.4 [Payment Endpoints](#54-payment-endpoints)
   - 5.5 [Dashboard Endpoints](#55-dashboard-endpoints)
   - 5.6 [Activity Endpoints](#56-activity-endpoints)
6. [Frontend Architecture](#6-frontend-architecture)
   - 6.1 [Routing & Layout](#61-routing--layout)
   - 6.2 [Context System](#62-context-system)
   - 6.3 [Service Layer](#63-service-layer)
   - 6.4 [UI Component Library](#64-ui-component-library)
7. [Security](#7-security)
   - 7.1 [Authentication Flow](#71-authentication-flow)
   - 7.2 [Authorization](#72-authorization)
   - 7.3 [Rate Limiting](#73-rate-limiting)
   - 7.4 [Input Validation](#74-input-validation)
   - 7.5 [Inactivity Timeout](#75-inactivity-timeout)
8. [Design System: Deep Slate](#8-design-system-deep-slate)
9. [Error Handling](#9-error-handling)
10. [Activity Logging](#10-activity-logging)
11. [Business Logic](#11-business-logic)
    - 11.1 [Credit Creation & Interest Calculation](#111-credit-creation--interest-calculation)
    - 11.2 [Payment Registration & Balance Update](#112-payment-registration--balance-update)
    - 11.3 [Dashboard KPI Computation](#113-dashboard-kpi-computation)
12. [Environment Variables](#12-environment-variables)
13. [Scripts & Tooling](#13-scripts--tooling)

---

## 1. System Overview

Kredio follows a **monolithic modular architecture** with a clear separation between a React SPA frontend and an Express REST API backend. The system uses a single PostgreSQL database and communicates over HTTP JSON.

**Key architectural decisions:**

- Monolithic deployment with modular code organization (not microservices)
- Layered backend: Controller -> Service -> Model -> Prisma ORM
- JWT-based authentication stored in httpOnly cookies
- Zod for runtime validation on every public endpoint
- Prisma ORM with migrations for type-safe database access
- Multi-currency support (ARS/USD) at the data model level
- In-memory rate limiting (no external cache dependency)

---

## 2. Project Structure

```
kredio/
+-- client/                          # React SPA (Vite)
|   +-- index.html                   # HTML entry point
|   +-- vite.config.ts               # Vite configuration
|   +-- tailwind.config.js           # TailwindCSS custom theme
|   +-- tsconfig.json                # TypeScript config
|   +-- tsconfig.tsbuildinfo
|   +-- src/
|   |   +-- main.tsx                 # React root + providers
|   |   +-- App.tsx                  # Router definition
|   |   +-- vite-env.d.ts
|   |   +-- types/index.ts           # Shared frontend types
|   |   +-- context/
|   |   |   +-- AuthContext.tsx      # Auth state provider
|   |   |   +-- ThemeContext.tsx     # Dark/Light theme provider
|   |   |   +-- LanguageContext.tsx  # i18n provider (ES/EN)
|   |   |   +-- AlertContext.tsx     # Global alert/notification provider
|   |   +-- services/
|   |   |   +-- api.ts              # Axios instance + interceptors
|   |   |   +-- auth.service.ts     # Auth API calls
|   |   |   +-- client.service.ts   # Client API calls
|   |   |   +-- credit.service.ts   # Credit API calls
|   |   |   +-- payment.service.ts  # Payment API calls
|   |   |   +-- dashboard.service.ts# Dashboard API calls
|   |   |   +-- activity.service.ts # Activity API calls
|   |   +-- hooks/
|   |   |   +-- useInactivityTracker.ts  # Session inactivity hook
|   |   +-- layouts/
|   |   |   +-- MainLayout.tsx      # Authenticated layout (sidebar + topbar + content)
|   |   +-- pages/
|   |   |   +-- LoginPage.tsx
|   |   |   +-- DashboardPage.tsx
|   |   |   +-- ClientsPage.tsx
|   |   |   +-- CreateClientPage.tsx
|   |   |   +-- ClientDetailPage.tsx
|   |   |   +-- EditClientPage.tsx
|   |   |   +-- CreditsPage.tsx
|   |   |   +-- CreateCreditPage.tsx
|   |   |   +-- CreditDetailPage.tsx
|   |   |   +-- EditCreditPage.tsx
|   |   |   +-- PaymentsPage.tsx
|   |   |   +-- ActivityPage.tsx
|   |   |   +-- HelpPage.tsx
|   |   +-- components/
|   |       +-- ui/
|   |           +-- index.ts
|   |           +-- Button.tsx
|   |           +-- Card.tsx
|   |           +-- Input.tsx
|   |           +-- Table.tsx
|   |           +-- Badge.tsx
|   |           +-- Modal.tsx
|   |           +-- Alert.tsx
|   |           +-- Loader.tsx
|   |           +-- ConfirmDialog.tsx
|   +-- dist/                        # Build output
|
+-- server/                          # Express REST API
|   +-- package.json
|   +-- tsconfig.json
|   +-- .eslintrc.json
|   +-- .prettierrc
|   +-- .env                         # Environment variables
|   +-- src/
|   |   +-- index.ts                 # Express app bootstrap
|   |   +-- config/
|   |   |   +-- index.ts             # Re-exports
|   |   |   +-- env.ts              # Environment config
|   |   |   +-- database.ts         # Prisma client singleton
|   |   |   +-- logger.ts           # Logger utility
|   |   +-- shared/
|   |   |   +-- constants/
|   |   |   |   +-- index.ts        # CREDIT_STATUS enum
|   |   |   +-- types/
|   |   |   |   +-- index.ts        # PaginationParams, PaginatedResponse
|   |   |   +-- errors/
|   |   |   |   +-- index.ts        # Re-exports
|   |   |   |   +-- AppError.ts     # AppError, NotFoundError, UnauthorizedError, etc.
|   |   |   +-- middlewares/
|   |   |   |   +-- index.ts        # Re-exports
|   |   |   |   +-- auth.middleware.ts      # JWT verification + inactivity check
|   |   |   |   +-- error.middleware.ts     # Global error handler
|   |   |   |   +-- request-logger.middleware.ts  # Dev request logging
|   |   |   |   +-- rate-limiter.middleware.ts    # Login brute-force protection
|   |   |   +-- utils/
|   |   |       +-- index.ts
|   |   |       +-- zod-error.ts    # Zod-to-AppError adapter
|   |   +-- modules/
|   |       +-- auth/
|   |       |   +-- routes/         # Router with endpoints
|   |       |   +-- controllers/    # HTTP request handling
|   |       |   +-- services/       # Business logic
|   |       |   +-- models/         # Database access
|   |       |   +-- validators/     # Zod schemas
|   |       |   +-- types/          # DTOs and interfaces
|   |       +-- clients/            # Same structure
|   |       +-- credits/            # Same structure
|   |       +-- payments/           # Same structure
|   |       +-- dashboard/          # Same structure
|   |       +-- activity/           # Same structure
|   +-- prisma/
|   |   +-- schema.prisma           # Data model definition
|   |   +-- migrations/             # SQL migration history
|   |   +-- seed/seed.ts            # Development seed data
|
+-- docs/
|   +-- ARCHITECTURE.md
+-- skills/
|   +-- Frontend-Skill.md           # IA coding guidelines for UI
+-- package.json                    # Root scripts (concurrently)
```

---

## 3. Backend Architecture

### 3.1 Entry Point & Bootstrap

**File:** `server/src/index.ts`

The Express application bootstraps in this order:

1. **Load environment variables** via `dotenv/config`
2. **Create Express instance**
3. **Apply global middleware:**
   - `cors()` - Cross-origin requests from `env.corsOrigin` and `localhost:3000`
   - `express.json()` - JSON body parsing
   - `cookieParser(env.jwtSecret)` - Signed cookie parsing for JWT
   - `requestLogger` - Dev-only request logging
4. **Mount public health check** at `GET /api/health`
5. **Mount module routers** at `/api/auth`, `/api/clients`, `/api/credits`, `/api/payments`, `/api/dashboard`, `/api/activity`
6. **Mount error middleware** (last, catches all errors)
7. **Start listening** on `env.port`

### 3.2 Configuration Layer

All config is in `server/src/config/`. Nothing is hardcoded in business logic.

| File | Responsibility |
|---|---|
| `env.ts` | Reads `process.env`, exports typed config object + cookie options |
| `database.ts` | Creates and exports a singleton `PrismaClient` instance |
| `logger.ts` | Exports `logger.info()`, `logger.error()`, `logger.warn()` with structured formatting |
| `index.ts` | Convenience re-exports |

**Cookie configuration (`env.ts` `cookieOptions`):**
- `httpOnly: true` in production (prevents XSS access)
- `secure: true` in production (HTTPS only)
- `sameSite: 'strict'` in production, `'lax'` in dev
- `maxAge: 7 days`

### 3.3 Shared Layer

#### Error Classes (`server/src/shared/errors/AppError.ts`)

```
AppError (base, statusCode)
+-- NotFoundError       (404)
+-- UnauthorizedError   (401)
+-- ForbiddenError      (403)
+-- ValidationError     (400)
```

All errors are `isOperational: true` to distinguish expected errors from programmer bugs.

#### Middleware Stack

| Middleware | File | Scope | Purpose |
|---|---|---|---|
| `cors` | npm | Global | Allow frontend origin |
| `express.json` | npm | Global | Parse JSON bodies |
| `cookieParser` | npm | Global | Parse signed cookies |
| `requestLogger` | custom | Global (dev) | Log method, URL, status, duration |
| `authMiddleware` | custom | Per-route | JWT verify + inactivity check |
| `loginRateLimiter` | custom | POST /api/auth/login | 5 attempts per 15 min per IP |
| `errorMiddleware` | custom | Global (last) | Catch-all error handler |

#### Auth Middleware Flow

1. Extract token from `req.cookies.token` or `Authorization: Bearer <token>`
2. Verify JWT with `env.jwtSecret`
3. Lookup user by `decoded.userId` in database
4. If `lastActivityAt` exists and exceeds `env.inactivityMs` (default 2h), clear cookie and reject
5. Update `lastActivityAt` in database
6. Set `req.userId` for downstream handlers

#### Rate Limiter

- In-memory `Map<ip, {count, resetAt}>`
- Window: 15 minutes
- Max: 5 attempts per IP
- Stale entries cleaned every 5 minutes via `setInterval`
- Returns `429 Too Many Requests` with retry-after in minutes

### 3.4 Module System

Each module follows a strict layered architecture. Dependencies flow in one direction:

```
Route (HTTP method + path)
  |
  v
Controller (parse input, call service, format response)
  |
  v
Service (business logic, orchestration, activity logging)
  |
  v
Model (Prisma queries, database access only)
```

**Rules:**
- Controllers never contain business logic
- Services never access the database directly (go through models)
- Models return plain data, never throw business errors
- Validators (Zod schemas) are used in controllers to parse request bodies
- Types/DTOs define the contract between layers

#### Module Inventory

| Module | Routes | Controllers | Services | Models | Validators | Types |
|---|---|---|---|---|---|---|
| **auth** | 5 routes | 5 handlers | 4 methods | 3 queries | 3 schemas | 3 interfaces |
| **clients** | 5 routes | 5 handlers | 4 methods | 5 queries | 2 schemas | 3 interfaces |
| **credits** | 4 routes | 4 handlers | 3 methods | 6 queries | 1 schema | 2 interfaces |
| **payments** | 3 routes | 3 handlers | 3 methods | 3 queries | 1 schema | 1 interface |
| **dashboard** | 1 route | 1 handler | 1 method | 4 queries | - | 1 interface |
| **activity** | 1 route | 1 handler | 2 methods | 2 queries | - | 1 interface |

### 3.5 Request Lifecycle

```
Client Request
  |
  v
CORS middleware
  |
  v
express.json() body parser
  |
  v
cookieParser (JWT cookie extraction)
  |
  v
requestLogger (dev only)
  |
  v
authMiddleware (JWT verify, inactivity check, user lookup)
  |  (rejects with 401 if invalid/expired)
  v
Module Router
  |
  v
Controller
  |  1. Parses & validates input with Zod schema
  |  2. Calls service with validated data + userId
  v
Service
  |  1. Orchestrates business logic
  |  2. May call multiple models
  |  3. Logs activity via activityService
  |  4. Returns result to controller
  v
Controller
  |  1. Formats HTTP response (status code, JSON body)
  v
Client Response
  |
  v
[If error at any layer]
  v
errorMiddleware
  - AppError -> statusCode + message
  - ZodError -> 400 + validation message
  - Other -> 500 + Internal server error
```

---

## 4. Database Schema

**ORM:** Prisma 5.x
**Provider:** PostgreSQL
**Connection:** `DATABASE_URL` + `DIRECT_URL` env vars

### 4.1 Entity Relationship Diagram

```
+------------------+       +------------------+
|      User        |       |      Client      |
|------------------|       |------------------|
| id (PK, UUID)    |<------| userId (FK)      |
| email (unique)   |       | id (PK, UUID)    |
| name             |       | name             |
| password (bcrypt)|       | phone?           |
| lastActivityAt?  |       | email?           |
| createdAt        |       | notes?           |
| updatedAt        |       | createdAt        |
+------------------+       | updatedAt        |
       |                   +------------------+
       |                          |
       |                          | (1:N)
       |                          v
       |                   +------------------+
       |                   |     Credit       |
       |                   |------------------|
       |                   | id (PK, UUID)    |
       |                   | amount (Decimal) |
       |                   | interestRate     |
       |                   | totalAmount      |
       |                   | balance          |
       |                   | currency (enum)  |
       |                   | installments     |
       |                   | frequency (enum) |
       |                   | description?     |
       |                   | status (enum)    |
       |                   | dueDate          |
       |                   | clientId (FK)    |
       |                   | userId (FK)      |
       |                   +------------------+
       |                          |
       |                          | (1:N)
       |                          v
       |                   +------------------+
       |                   |     Payment      |
       |                   |------------------|
       |                   | id (PK, UUID)    |
       |                   | amount (Decimal) |
       |                   | date             |
       |                   | note?            |
       |                   | creditId (FK)    |
       |                   | userId (FK)      |
       |                   +------------------+
       |
       | (1:N)
       v
+------------------+
|   ActivityLog    |
|------------------|
| id (PK, UUID)    |
| action (string)  |
| entity (string)  |
| entityId (string)|
| details (JSON?)  |
| userId (FK)      |
| createdAt        |
+------------------+
```

### 4.2 Models Detail

#### User

```prisma
model User {
  id             String       @id @default(uuid())
  email          String       @unique
  name           String
  password       String
  lastActivityAt DateTime?    @map("last_activity_at")
  createdAt      DateTime     @default(now()) @map("created_at")
  updatedAt      DateTime     @updatedAt @map("updated_at")

  clients      Client[]
  credits      Credit[]
  payments     Payment[]
  activityLogs ActivityLog[]

  @@map("users")
}
```

- `password` stores bcrypt hash (12 salt rounds)
- `lastActivityAt` drives the inactivity timeout mechanism
- Cascade delete: when user is deleted, all owned data is removed

#### Client

```prisma
model Client {
  id        String   @id @default(uuid())
  name      String
  phone     String?
  email     String?
  notes     String?
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")
  userId    String   @map("user_id")

  user     User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  credits  Credit[]

  @@map("clients")
}
```

- Scoped to user: every query includes `userId` filter
- `credits` relation includes nested `payments`

#### Credit

```prisma
model Credit {
  id           String           @id @default(uuid())
  amount       Decimal          @db.Decimal(10, 2)
  interestRate Decimal          @default(0) @db.Decimal(5, 2) @map("interest_rate")
  totalAmount  Decimal          @db.Decimal(10, 2) @map("total_amount")
  balance      Decimal          @db.Decimal(10, 2)
  currency     Currency         @default(ARS)
  installments Int              @map("installments")
  frequency    PaymentFrequency @default(MONTHLY) @map("frequency")
  description  String?
  status       CreditStatus     @default(ACTIVE)
  dueDate      DateTime         @map("due_date")
  createdAt    DateTime         @default(now()) @map("created_at")
  updatedAt    DateTime         @updatedAt @map("updated_at")
  clientId     String           @map("client_id")
  userId       String           @map("user_id")

  client   Client    @relation(fields: [clientId], references: [id], onDelete: Cascade)
  user     User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  payments Payment[]

  @@map("credits")
}
```

- `totalAmount = amount + (amount * interestRate / 100)` calculated at creation
- `balance` starts equal to `totalAmount`, decreases with payments
- When `balance <= 0` after a payment, status becomes `PAID`

#### Payment

```prisma
model Payment {
  id        String   @id @default(uuid())
  amount    Decimal  @db.Decimal(10, 2)
  date      DateTime @default(now())
  note      String?
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")
  creditId  String   @map("credit_id")
  userId    String   @map("user_id")

  credit Credit @relation(fields: [creditId], references: [id], onDelete: Cascade)
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("payments")
}
```

- Immutable by design (no update/delete endpoints in v1.0.0)
- `date` defaults to `now()` if not provided

#### ActivityLog

```prisma
model ActivityLog {
  id        String   @id @default(uuid())
  action    String
  entity    String
  entityId  String   @map("entity_id")
  details   Json?
  createdAt DateTime @default(now()) @map("created_at")
  userId    String   @map("user_id")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("activity_logs")
}
```

- `details` is a free-form JSON field for event-specific metadata
- Used for audit trail; the most recent 20 entries are surfaced to the UI

### 4.3 Enums & Constraints

```prisma
enum CreditStatus {
  ACTIVE
  PAID
  OVERDUE
  CANCELLED
}

enum Currency {
  ARS
  USD
}

enum PaymentFrequency {
  WEEKLY
  BIWEEKLY
  MONTHLY
}
```

**Decimal precision:**
- `amount`, `totalAmount`, `balance`: `Decimal(10, 2)` (10 total digits, 2 decimal places)
- `interestRate`: `Decimal(5, 2)` (5 total digits, 2 decimal places, max 999.99%)

**Cascade rules:**
- `User` -> `Client`, `Credit`, `Payment`, `ActivityLog`: CASCADE on delete
- `Client` -> `Credit`: CASCADE on delete
- `Credit` -> `Payment`: CASCADE on delete

---

## 5. API Reference

### 5.1 Auth Endpoints

Base path: `/api/auth`

#### POST `/register`

Create a new user account.

```
Request:
{
  "email": "user@example.com",
  "name": "John Doe",
  "password": "Str0ng!Pass"
}

Response 201:
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "createdAt": "2026-06-12T..."
  }
}
```

Sets JWT cookie on success. Password must contain uppercase, lowercase, number, and special character. Minimum 8 characters.

#### POST `/login`

Authenticate existing user. Protected by rate limiter (5 attempts per 15 minutes per IP).

```
Request:
{
  "email": "user@example.com",
  "password": "Str0ng!Pass"
}

Response 200:
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

#### POST `/google`

Google OAuth authentication.

```
Request:
{
  "credential": "google-id-token"
}

Response 200:
{
  "user": {
    "id": "uuid",
    "email": "user@gmail.com",
    "name": "John Doe"
  }
}
```

If the Google email doesn't exist, a new user is created with a random password.

#### POST `/logout`

Clears JWT cookie. Requires authentication.

```
Response 200:
{
  "message": "Logged out successfully"
}
```

#### GET `/profile`

Returns the authenticated user's profile. Requires authentication.

```
Response 200:
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "John Doe",
  "lastActivityAt": "2026-06-12T10:00:00.000Z",
  "createdAt": "2026-06-10T..."
}
```

### 5.2 Client Endpoints

Base path: `/api/clients` (all require authentication)

#### GET `/`

List all clients with summary of their credits.

```
Response 200:
[
  {
    "id": "uuid",
    "name": "Client Name",
    "phone": "+5491112345678",
    "email": "client@example.com",
    "notes": null,
    "createdAt": "...",
    "updatedAt": "...",
    "credits": [
      { "id": "uuid", "amount": 10000, "balance": 5000, "status": "ACTIVE", "dueDate": "..." }
    ],
    "activeCredits": 1,
    "totalDebt": 5000
  }
]
```

#### POST `/`

Create a new client.

```
Request:
{
  "name": "Client Name",
  "phone": "+5491112345678",    // optional
  "email": "client@example.com", // optional
  "notes": "Some notes"          // optional
}

Response 201:
{ "id": "uuid", "name": "...", ... }
```

#### GET `/:id`

Get client detail including all credits with payment history.

#### PUT `/:id`

Update client fields. Same schema as create but all fields optional.

#### DELETE `/:id`

Delete client and all associated credits/payments. Returns `204 No Content`.

### 5.3 Credit Endpoints

Base path: `/api/credits` (all require authentication)

#### POST `/`

Create a new credit for a client.

```
Request:
{
  "clientId": "uuid",
  "amount": 10000,
  "interestRate": 15,
  "installments": 6,
  "frequency": "MONTHLY",
  "currency": "ARS",           // optional, defaults to ARS
  "description": "Loan for X", // optional
  "dueDate": "2026-07-12"      // ISO date string
}

Response 201:
{ "id": "uuid", "amount": 10000, "totalAmount": 11500, "balance": 11500, ... }
```

`totalAmount` is auto-calculated: `amount + (amount * interestRate / 100)`.

#### GET `/`

List all credits with client name.

#### GET `/:id`

Get credit detail including payments and client info.

#### GET `/client/:clientId`

List all credits for a specific client.

### 5.4 Payment Endpoints

Base path: `/api/payments` (all require authentication)

#### POST `/`

Register a payment against a credit.

```
Request:
{
  "creditId": "uuid",
  "amount": 5000,
  "date": "2026-06-15", // optional, defaults to now
  "note": "First payment" // optional
}

Response 201:
{ "id": "uuid", "amount": 5000, "creditId": "uuid", ... }
```

**Side effects:**
- Credit balance is reduced by the payment amount
- If new balance <= 0, credit status changes to `PAID`
- Activity log entry is created

#### GET `/`

List all payments with credit and client info.

#### GET `/credit/:creditId`

List all payments for a specific credit.

### 5.5 Dashboard Endpoints

Base path: `/api/dashboard` (requires authentication)

#### GET `/`

Returns KPI summary for the authenticated user.

```
Response 200:
{
  "activeCredits": 5,
  "overdueCredits": 1,
  "totalPortfolio": 57500,
  "totalPortfolioArs": 46000,
  "totalPortfolioUsd": 11500,
  "collectedAmount": 25000,
  "collectedAmountArs": 20000,
  "collectedAmountUsd": 5000,
  "pendingAmount": 32500,
  "pendingAmountArs": 26000,
  "pendingAmountUsd": 6500,
  "recentPayments": [
    { "id": "uuid", "amount": 5000, "date": "...", "clientName": "Client", "currency": "ARS" }
  ],
  "upcomingDueDates": [
    { "id": "uuid", "clientName": "Client", "amount": 10000, "dueDate": "...", "balance": 5000, "currency": "ARS" }
  ]
}
```

### 5.6 Activity Endpoints

Base path: `/api/activity` (requires authentication)

#### GET `/`

Returns the 20 most recent activity log entries.

```
Response 200:
[
  {
    "id": "uuid",
    "action": "payment.registered",
    "entity": "payment",
    "entityId": "uuid",
    "details": { "amount": 5000, "creditId": "uuid", "newBalance": 6500 },
    "createdAt": "..."
  }
]
```

---

## 6. Frontend Architecture

**Stack:** React 18, TypeScript, Vite 5, TailwindCSS 3, React Router 6, Axios, React Icons

### 6.1 Routing & Layout

**`App.tsx`** defines a React Router v6 tree with two branches:

```
/login          -> LoginPage (public)
/               -> MainLayout (protected, wraps all authenticated routes)
  /             -> DashboardPage
  /clients      -> ClientsPage
  /clients/new  -> CreateClientPage
  /clients/:id  -> ClientDetailPage
  /clients/:id/edit -> EditClientPage
  /credits      -> CreditsPage
  /credits/new  -> CreateCreditPage
  /credits/:id  -> CreditDetailPage
  /credits/:id/edit -> EditCreditPage
  /payments     -> PaymentsPage
  /activity     -> ActivityPage
  /help         -> HelpPage
```

**ProtectedRoute** component:
- Reads `user` and `isLoading` from `AuthContext`
- If `isLoading`, renders a full-screen loading indicator
- If no `user`, redirects to `/login`
- Otherwise renders children (the authenticated layout + page)

**MainLayout** provides the shell:
- Sidebar (navigation, logo, upgrade banner)
- Topbar (search, welcome message, theme toggle, user menu)
- `<Outlet />` for nested route content

### 6.2 Context System

#### AuthContext

```tsx
interface AuthContextType {
  user: { id: string; email: string; name: string } | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  googleLogin: (credential: string) => Promise<void>;
  logout: () => Promise<void>;
}
```

- On mount: calls `GET /api/auth/profile` to restore session from cookie
- Exposes login, register, googleLogin, logout methods
- All auth services update the `user` state on success

#### ThemeContext

```tsx
interface ThemeContextType {
  theme: 'dark' | 'light';
  toggleTheme: () => void;
}
```

- Defaults to dark mode
- Toggles `data-theme` attribute on document
- Persists preference (likely localStorage)

#### LanguageContext

- Controls `ES`/`EN` switching
- Used across the UI for static text localization

#### AlertContext

- Global notification/alert state
- Used to display success/error toasts after mutations

### 6.3 Service Layer

**`api.ts`** creates an Axios instance with:
- `baseURL: 'http://localhost:3001/api'` (delegated to Vite proxy in production)
- `withCredentials: true` for cookie-based auth
- Response interceptor: on 401, triggers logout

Each domain has a dedicated service file:

| Service | Key Methods |
|---|---|
| `auth.service.ts` | `login()`, `register()`, `googleLogin()`, `logout()`, `getProfile()` |
| `client.service.ts` | `getAll()`, `getById()`, `create()`, `update()`, `delete()` |
| `credit.service.ts` | `getAll()`, `getById()`, `getByClient()`, `create()` |
| `payment.service.ts` | `getAll()`, `getByCredit()`, `create()` |
| `dashboard.service.ts` | `getDashboard()` |
| `activity.service.ts` | `getAll()` |

### 6.4 UI Component Library

All components in `client/src/components/ui/`:

| Component | Props | Description |
|---|---|---|
| **Button** | `variant` (primary/secondary/danger/ghost), `size`, `loading`, `disabled`, `children` | Styled button with loading state |
| **Card** | `title`, `children`, `className` | Container card with header |
| **Input** | `label`, `error`, `type`, `...inputProps` | Form input with label and error message |
| **Table** | `columns`, `data`, `onRowClick` | Data table with sortable headers |
| **Badge** | `variant` (success/warning/danger/info), `children` | Status pill |
| **Modal** | `isOpen`, `onClose`, `title`, `children` | Overlay modal |
| **Alert** | `type` (success/error/warning/info), `message`, `onClose` | Dismissible alert |
| **Loader** | `size` | Spinner component |
| **ConfirmDialog** | `isOpen`, `title`, `message`, `onConfirm`, `onCancel` | Confirmation modal |

---

## 7. Security

### 7.1 Authentication Flow

```
                       User
                        |
                        v
                Login Form (email + password)
                        |
                        v
               POST /api/auth/login
                        |
                        v
               authController.login()
                +-----------------------+
                | 1. Validate with Zod  |
                | 2. authService.login()|
                | 3. Find user by email |
                | 4. bcrypt.compare()   |
                | 5. Generate JWT       |
                | 6. Set httpOnly cookie|
                +-----------------------+
                        |
                        v
            Browser stores cookie (httpOnly)
                        |
                        v
              Subsequent requests:
              Cookie sent automatically
                        |
                        v
               authMiddleware:
                +-----------------------+
                | 1. Extract cookie     |
                | 2. jwt.verify()       |
                | 3. Find user by ID    |
                | 4. Check inactivity   |
                | 5. Update lastActivity|
                | 6. Set req.userId     |
                +-----------------------+
```

**JWT payload:**
```json
{
  "userId": "uuid",
  "iat": 1718000000,
  "exp": 1718604800
}
```

- Secret: `env.jwtSecret`
- Expiration: `env.jwtExpiresIn` (default 7 days)
- Transport: Signed httpOnly cookie (name: `token`)

### 7.2 Authorization

The auth middleware applies to all routes except:
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/google`
- `GET /api/health`

Data isolation is enforced at the query level: every `prisma.findMany` and `prisma.findFirst` includes `where: { userId: req.userId }`.

### 7.3 Rate Limiting

- Applied only to `POST /api/auth/login`
- In-memory `Map<string, {count, resetAt}>`
- Window: 15 minutes
- Limit: 5 failed attempts per IP
- Stale entries are garbage-collected every 5 minutes

### 7.4 Input Validation

All endpoints use Zod schemas for runtime validation:

| Schema | Rules |
|---|---|
| `registerSchema` | email (valid format), name (2-100 chars), password (8-128 chars, uppercase, lowercase, number, special) |
| `loginSchema` | email (valid format), password (required) |
| `googleLoginSchema` | credential (required) |
| `createClientSchema` | name (required), phone (optional), email (valid or empty), notes (optional) |
| `createCreditSchema` | clientId (UUID), amount (positive), interestRate (>=0), installments (positive int), frequency (enum), currency (optional enum), description (optional), dueDate (valid ISO date) |
| `registerPaymentSchema` | creditId (UUID), amount (positive), date (optional), note (optional) |

Validation errors return `400` with the Zod error message.

### 7.5 Inactivity Timeout

- Checked in `authMiddleware` on every authenticated request
- If `user.lastActivityAt` exists and `Date.now() - lastActivityAt > env.inactivityMs` (default 2 hours)
  - Cookie is cleared
  - Request returns `401 Session expired due to inactivity`
- On successful auth, `lastActivityAt` is updated to `new Date()`

---

## 8. Design System: Deep Slate

The **Deep Slate** design system is defined in `skills/Frontend-Skill.md` and implemented via TailwindCSS custom theme and CSS custom properties.

### Color Tokens

| Token | Dark | Light |
|---|---|---|
| `--color-bg-base` | `#0d1117` | `#f0f4f8` |
| `--color-bg-sidebar` | `#111827` | `#e8ecf2` |
| `--color-bg-card` | `#1a2235` | `#ffffff` |
| `--color-accent-purple` | `#7c5cfc` | `#6c4fec` |
| `--color-text-primary` | `#e8edf5` | `#1a2235` |
| `--color-text-secondary` | `#8a9bb5` | `#4d6080` |

### Typography

- **Font family:** `'Inter', 'DM Sans', system-ui, sans-serif`
- **Scale:** 11px to 36px with specific weights for each context
- KPIs: 36px / 800 weight
- Labels: 11px / 400 / uppercase / 0.06em letter-spacing
- Navigation: 13px / 500

### Layout

- **Desktop:** Sidebar 240px + Content grid `1fr 260px`
- **Tablet:** Sidebar 60px (icons only) + full-width content
- **Mobile:** Hidden sidebar (drawer) + single-column stacked layout

---

## 9. Error Handling

All errors pass through `errorMiddleware` registered last in the Express middleware chain.

```
Error Types:
+-- AppError (expected, operational)
|   +-- NotFoundError (404)     - Resource not found
|   +-- UnauthorizedError (401) - Invalid/missing auth
|   +-- ForbiddenError (403)    - Not authorized for action
|   +-- ValidationError (400)   - Invalid input (from Zod)
+-- ZodError (400)              - Direct from controller .parse()
+-- Error (500)                 - Unexpected/programmer error
```

**Response format:**
```json
{
  "error": "Human-readable error message"
}
```

Zod validation errors return only the first error message instead of accumulating all.

---

## 10. Activity Logging

Every meaningful action is logged via `activityService.log()`:

| Action | Entity | Details |
|---|---|---|
| `client.created` | client | `{ name }` |
| `credit.created` | credit | `{ amount, currency, clientName, installments, frequency }` |
| `payment.registered` | payment | `{ amount, creditId, newBalance }` |

The log entry contains:
- `action`: String identifier (e.g., `payment.registered`)
- `entity`: Domain entity type (e.g., `client`, `credit`, `payment`)
- `entityId`: UUID of the affected record
- `details`: JSON object with action-specific metadata
- `createdAt`: Auto-timestamp
- `userId`: The authenticated user who performed the action

Retrieval: `GET /api/activity` returns the 20 most recent entries.

---

## 11. Business Logic

### 11.1 Credit Creation & Interest Calculation

```
totalAmount = amount + (amount * interestRate / 100)
balance = totalAmount (initially)
```

- `amount`: Principal lent to the client
- `interestRate`: Percentage (e.g., 15 means 15%)
- `totalAmount`: Principal + interest = what the client must repay
- `balance`: Remaining debt, decremented by payments
- `installments`: Number of payment periods (informational, not auto-calculated)
- `frequency`: Payment frequency (WEEKLY, BIWEEKLY, MONTHLY)
- `status`: Always starts as `ACTIVE`

### 11.2 Payment Registration & Balance Update

```
newBalance = credit.balance - payment.amount

if newBalance <= 0:
    credit.status = PAID
    credit.balance = 0
else:
    credit.balance = newBalance
```

- Payments are immutable (no editing or deletion in v1.0.0)
- Overpayment results in status `PAID` and balance `0`
- No validation that payment matches installment amount (manual control)

### 11.3 Dashboard KPI Computation

```
activeCredits     = count where status == ACTIVE
overdueCredits    = count where status == ACTIVE AND dueDate < now()
totalPortfolio    = sum(totalAmount) across all credits
collectedAmount   = sum(amount) across all payments
pendingAmount     = sum(balance) across all credits
```

All values are computed per-currency (ARS/USD) and as a combined total.

---

## 12. Environment Variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3000` | Server port |
| `NODE_ENV` | `dev` | Environment (`dev`/`production`) |
| `DATABASE_URL` | (required) | PostgreSQL connection string |
| `DIRECT_URL` | (required) | Direct PostgreSQL connection (for migrations) |
| `JWT_SECRET` | `change-this-secret-in-production` | JWT signing key |
| `JWT_EXPIRES_IN` | `7d` | JWT expiration duration |
| `CORS_ORIGIN` | `http://localhost:5173` | Allowed CORS origin |
| `GOOGLE_CLIENT_ID` | `""` | Google OAuth client ID |
| `GOOGLE_SECRET_KEY` | `""` | Google OAuth client secret |
| `INACTIVITY_MS` | `7200000` | Inactivity timeout in ms (default 2h) |

---

## 13. Scripts & Tooling

### Root (concurrently)

| Script | Command |
|---|---|
| `npm run dev` | `concurrently -n client,server -c cyan,green "npm run dev --prefix client" "npm run dev --prefix server"` |

### Server

| Script | Command | Purpose |
|---|---|---|
| `dev` | `tsx watch src/index.ts` | Development with hot-reload |
| `build` | `tsc` | TypeScript compilation |
| `start` | `node dist/index.js` | Production start |
| `lint` | `eslint src --ext .ts` | Lint check |
| `format` | `prettier --write "src/**/*.ts"` | Code formatting |
| `prisma:generate` | `prisma generate` | Generate Prisma client |
| `prisma:migrate` | `prisma migrate dev` | Run pending migrations |
| `prisma:seed` | `tsx prisma/seed/seed.ts` | Seed development data |
| `prisma:studio` | `prisma studio` | Open Prisma Studio GUI |

### Client

| Script | Command | Purpose |
|---|---|---|
| `dev` | `vite` | Vite dev server |
| `build` | `tsc -b && vite build` | Production build |
| `preview` | `vite preview` | Preview production build |
| `lint` | `eslint src --ext .ts,.tsx` | Lint check |

### Tooling versions

- Node.js 18+
- TypeScript 5.6+
- Prisma 5.x
- Vite 5.x
- React 18.x
- TailwindCSS 3.x
- Express 4.x
- tsx 4.x (TypeScript execution engine)
