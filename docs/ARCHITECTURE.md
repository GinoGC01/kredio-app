# Kredio Architecture

## Overview

Monolithic modular system for credit/debt management.

## Structure

```
/client   - React + TypeScript + TailwindCSS frontend
/server   - Node.js + Express + TypeScript + Prisma backend
/docs     - Documentation
```

## Backend Modules

- **auth** - Authentication (register, login, JWT)
- **clients** - Client CRUD
- **credits** - Credit management
- **payments** - Payment registration
- **dashboard** - Dashboard statistics
- **activity** - Activity log

## Principles

1. Controllers have no business logic
2. All business logic lives in services
3. All DB access goes through models
4. Modules are independent
5. Consistent structure across modules
