# AGENTS.md - Working Rules for duggu-arts-official

## Project Context

Handmade Flower & Craft E-commerce Website for Duggu Arts Official.
Tech Stack: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, shadcn/ui, Lucide icons, Firebase Auth, Cloud Firestore, Firebase Admin SDK, Cloudinary.

---

## Mandatory Working Rules

### 1. Dependency Management

- **Use latest stable versions** — verify with `npm view <pkg> version` and official docs before adding any dependency.
- **Justify each dependency** — explain why it's necessary; avoid unnecessary packages.
- **Avoid deprecated packages** and outdated implementation patterns.
- **Check compatibility** — React 19, Next.js 16, TypeScript 5+, Tailwind CSS 4.

### 2. Next.js App Router Conventions

- **App Router only** — no Pages Router.
- Follow conventions of **installed Next.js version** (check `node_modules/next/dist/docs/` for bundled docs).
- Use **Route Handlers** (`route.ts`) for API endpoints.
- Use **Server Components** by default; `'use client'` only when necessary.
- **Server Actions** for mutations where appropriate.

### 3. TypeScript & Validation

- **Strict TypeScript** — `strict: true` (already configured).
- **Zod validation on every API input** — both Route Handlers and Server Actions.
- Define shared types in `lib/types/` or `types/`.
- Use `z.infer<typeof schema>` for type inference.

### 4. Firebase Admin SDK Isolation

- **Never import `firebase-admin` in proxy/edge code** (middleware, Edge Route Handlers).
- **Server-only files must use `import "server-only"`** at the top.
- Create a dedicated `lib/firebase/admin.ts` for Admin SDK initialization.
- Admin SDK bypasses Firestore rules — **every server API must independently validate permissions**.

### 5. Secrets & Environment Variables

- **No secrets in client bundles** — all secrets via `.env.local`.
- **Commit `.env.example`** with placeholder values.
- Use `@t3-oss/env-nextjs` or similar for type-safe env validation.
- Prefix client-safe vars with `NEXT_PUBLIC_`; never expose private keys to client.

### 6. Authorization & Permissions

- **Every server API checks permissions itself** — Admin SDK bypasses rules.
- Implement `requireAuth()` and `requireAdmin()` utilities in `lib/auth/`.
- Customer ownership checks on all user-scoped operations.
- Firestore **deny-by-default security rules** as defense-in-depth.

### 7. Host-Agnostic Code

- **No Vercel-only features** — hosting is undecided.
- Use standard Next.js APIs that work on any Node.js hosting.
- Avoid `next/headers` in Edge runtime; use Node.js runtime for auth.

### 8. Phased Workflow

- **Work one phase at a time**.
- After each phase:
  1. Summarize what changed.
  2. List how to test it.
  3. **STOP and wait for approval** before proceeding.

### 9. Security Requirements

- Server-side Firebase session verification (HTTP-only cookies).
- CSRF protection for mutating endpoints.
- Rate limiting (free-compatible approach, e.g., Upstash Redis free tier or in-memory with caveats).
- Input validation (Zod) + upload validation (file type, size).
- Server-side pricing and stock validation.
- Protection against duplicate order submissions (idempotency keys).
- No payment credentials in WhatsApp messages or Firestore.

### 10. Cloudinary Image Management

- Server-side signed uploads only.
- Never expose Cloudinary API secret to browser.
- Store Cloudinary URLs + public IDs in Firestore.
- Do not delete images still referenced by other records.

### 11. WhatsApp Checkout

- Server validates cart, recalculates prices, checks stock.
- Creates pending order in Firestore with order reference.
- Generates WhatsApp click-to-chat URL with prefilled message.
- **Never mark order confirmed/paid just because WhatsApp link opened**.
- Distinguish: submitted → WhatsApp sent → business confirmed → payment verified.

---

## Development Workflow

1. **Inspect** → Check versions, docs, existing code.
2. **Plan** → Propose folder structure, architecture, dependencies.
3. **Implement** → One phase at a time, with approval gates.
4. **Test** → Manual + automated where feasible.
5. **Document** → Update AGENTS.md, README, code comments as needed.

---

## Communication Protocol

- **Ask before assuming** — use `ask_user_question` for ambiguities.
- **Report progress** — summarize after each phase.
- **No code generation** until architecture approved.
- **No package installation** until dependency list approved.
