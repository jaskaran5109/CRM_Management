# PROJECT_CONTEXT

## 1. Project Overview

### Purpose of the system
This repository implements a CRM-style service operations dashboard with two major responsibilities:

1. Internal CRM operations for staff:
   - user authentication
   - user and role administration
   - customer lead/CX data management
   - complaint intake, assignment, status progression, comments, and history
   - dashboard analytics

2. External customer self-service:
   - public complaint submission
   - complaint tracking by phone/email
   - customer-visible comment thread on their complaint

### Business domain
The domain is customer service / complaint management for a product-service business. The code suggests a workflow where:

- customers report issues tied to models and service categories
- internal teams triage and route complaints based on role-specific workflow statuses
- admins manage users, user roles, statuses, role-to-status mappings, models, and service categories
- customer lead data is also maintained separately as `CXData` / `Customer`

### Core functionality
- JWT-based authentication with signup, login, profile update, password change, forgot/reset password
- Admin-managed reference/master data:
  - statuses
  - user roles
  - role statuses with next-role workflow transitions
  - CX models
  - CX service categories
- Customer/CX data CRUD with filters, pagination, bulk import, and bulk delete
- Complaint lifecycle:
  - internal complaint creation
  - public complaint creation
  - list/detail/history
  - status transition validation by role
  - assignment
  - internal and public comments
  - email notifications
- Dashboard analytics for users, customers, categories, workflow, and trends
- Theme-aware React dashboard UI with protected admin and authenticated routes

### Main modules/services
- `server/index.js`: Express bootstrap, middleware, route mounting, MongoDB connection
- `server/routes/auth.js`: auth and account lifecycle
- `server/routes/users.js`: admin user management
- `server/routes/status.js`, `userRole.js`, `roleStatus.js`, `cxModel.js`, `cxServiceCategory.js`: master data management
- `server/routes/cxData.js`: customer/CX data operations
- `server/routes/dashboard.js`: dashboard analytics endpoints
- `server/routes/complaints.js` + `controllers/complaintController.js`: authenticated complaint operations
- `server/routes/publicComplaints.js` + `controllers/publicComplaintController.js`: public complaint portal
- `client/src/App.jsx`: route map
- `client/src/redux`: application state, async API thunks, auth persistence
- `client/src/pages`: page-level UI
- `client/src/components`: reusable layout and complaint components

### High-level architecture
```text
React + Redux Toolkit SPA
        |
        | REST/JSON over fetch
        v
Express 5 API
        |
        +-- Auth / Admin / CX Data / Dashboard routes
        +-- Complaint controllers + workflow utilities
        +-- Resend email integration
        +-- External India states/cities API
        |
        v
MongoDB via Mongoose
```

### System design philosophy
Observed design philosophy is pragmatic, feature-driven, and monolithic:

- single deployable backend
- single deployable frontend
- route-per-domain structure on the backend
- Redux slices per functional area on the frontend
- minimal abstraction layers
- business rules embedded directly in route handlers and controllers
- MongoDB schemas used as primary domain model

This is not a heavily layered or hexagonal architecture. It is a conventional full-stack JavaScript application with selective abstraction around complaint workflow and email sending.

## 2. Tech Stack

| Area | Technology | Version / Source |
| --- | --- | --- |
| Monorepo root | npm scripts + `concurrently` | `^9.2.1` |
| Frontend runtime | React | `^19.2.4` |
| Frontend routing | `react-router-dom` | `^7.13.1` |
| Frontend state | Redux Toolkit + React Redux | `^2.11.2`, `^9.2.0` |
| Frontend build | Vite | `^8.0.0` |
| Frontend styling | CSS files + Tailwind Vite plugin present | `@tailwindcss/vite ^4.2.4`, `tailwindcss ^4.2.4` |
| Frontend charts | Chart.js + react-chartjs-2 | `^4.5.1`, `^5.3.1` |
| Frontend motion | Framer Motion | `^12.38.0` |
| Frontend notifications | `react-toastify`, `react-hot-toast` | `^11.0.5`, `^2.6.0` |
| Frontend icons | `react-icons` | `^5.6.0` |
| Frontend spreadsheet import/export | `xlsx` | `^0.18.5` |
| Frontend linting | ESLint 9 flat config | `^9.39.4` |
| Backend runtime | Node.js ESM | implied by `"type": "module"` |
| Backend framework | Express | `^5.2.1` |
| Database | MongoDB | via `mongoose` and `mongodb` drivers |
| ODM | Mongoose | `^9.3.0` |
| Auth | JWT via `jsonwebtoken` | `^9.0.3` |
| Password hashing | `bcryptjs` | `^3.0.3` |
| Security headers | `helmet` | `^7.0.0` |
| CORS | `cors` | `^2.8.6` |
| Rate limiting | `express-rate-limit` | `^7.0.0` |
| Request sanitization | `express-mongo-sanitize` + custom XSS escaping | `^2.2.0` |
| Validation library | `express-validator` installed but not used meaningfully | `^7.3.2` |
| File upload | `multer` | `^1.4.5-lts.1` |
| Email | Resend | `^6.10.0` |
| Alternative email lib | Nodemailer installed, mostly unused | `^8.0.5` |
| Deployment targets | Render, Railway, Vercel | `server/render.yaml`, `server/railway.json`, `client/vercel.json` |
| Process bootstrap | Procfile | `server/Procfile` |
| Testing | Node built-in test runner script only | no meaningful tests found |
| Monitoring/logging | console logging only | no structured logger/monitoring |

### What is not present
- no TypeScript source despite `tsconfig.json` files
- no Dockerfile / docker-compose
- no Kubernetes
- no CI workflow files
- no Redis / queue / cache layer
- no WebSocket or event bus
- no ORM beyond Mongoose ODM

## 3. Complete Folder Structure

### Repository tree
```text
crm-dashboard/
|- package.json
|- package-lock.json
|- tsconfig.json
|- .gitignore
|- client/
|  |- package.json
|  |- package-lock.json
|  |- vite.config.js
|  |- eslint.config.js
|  |- vercel.json
|  |- .env
|  |- .env.example
|  |- index.html
|  |- public/
|  |  |- favicon.svg
|  |  `- icons.svg
|  `- src/
|     |- App.jsx
|     |- main.jsx
|     |- api.js
|     |- App.css
|     |- index.css
|     |- AuthLayout.jsx
|     |- assets/
|     |- config/
|     |  `- apiConfig.js
|     |- services/
|     |  |- apiClient.js
|     |  |- complaintService.js
|     |  `- publicComplaintService.js
|     |- redux/
|     |  |- store.js
|     |  `- slices/
|     |     |- authSlice.js
|     |     |- complaintSlice.js
|     |     |- cxDataSlice.js
|     |     |- dashboardSlice.js
|     |     |- themeSlice.js
|     |     |- userSlice.js
|     |     `- adminSlices/
|     |- components/
|     |  |- AppShell.jsx
|     |  |- Sidebar.jsx
|     |  |- Topbar.jsx
|     |  |- ThemeInitializer.jsx
|     |  |- Navbar.jsx
|     |  |- PrivateRoute.js
|     |  |- common/
|     |  `- complaints/
|     |- protectedRoute/
|     |  |- ProtectedRoute.jsx
|     |  `- AdminRoute.jsx
|     |- pages/
|     |  |- Login.jsx
|     |  |- Signup.jsx
|     |  |- ForgotPassword.jsx
|     |  |- ResetPassword.jsx
|     |  |- Dashboard.jsx
|     |  |- AdminDashboard.jsx
|     |  |- Profile.jsx
|     |  |- CXData.jsx
|     |  |- Complaints.jsx
|     |  |- CreateComplaint.jsx
|     |  |- ComplaintDetail.jsx
|     |  |- PublicComplaintForm.jsx
|     |  |- TrackComplaint.jsx
|     |  `- AdminPages/
|     |- styles/
|     `- utils/
|- server/
|  |- package.json
|  |- package-lock.json
|  |- tsconfig.json
|  |- index.js
|  |- .env
|  |- .env.example
|  |- Procfile
|  |- railway.json
|  |- render.yaml
|  |- config/
|  |  `- appConfig.js
|  |- middleware/
|  |  `- auth.js
|  |- controllers/
|  |  |- complaintController.js
|  |  `- publicComplaintController.js
|  |- models/
|  |  |- User.js
|  |  |- UserRole.js
|  |  |- Status.js
|  |  |- RoleStatus.js
|  |  |- CXModel.js
|  |  |- CXServiceCategory.js
|  |  |- CXData.js
|  |  |- Complaint.js
|  |  |- ComplaintComment.js
|  |  |- ComplaintHistory.js
|  |  `- Comment.js
|  |- routes/
|  |  |- auth.js
|  |  |- users.js
|  |  |- status.js
|  |  |- userRole.js
|  |  |- roleStatus.js
|  |  |- stateCities.js
|  |  |- cxModel.js
|  |  |- cxServiceCategory.js
|  |  |- cxData.js
|  |  |- dashboard.js
|  |  |- complaints.js
|  |  `- publicComplaints.js
|  |- utils/
|  |  |- complaintPermissionUtils.js
|  |  |- complaintWorkflow.js
|  |  `- emailService.js
|  `- uploads/
|     `- complaints/
`- node_modules/
```

### Folder purposes

| Path | Purpose | What belongs there |
| --- | --- | --- |
| `client/src/pages` | route-level screens | page containers, local page orchestration |
| `client/src/components` | reusable UI and layout | shared UI building blocks, shell components, complaint widgets |
| `client/src/redux/slices` | state domains | async thunks, slice reducers, local state logic |
| `client/src/services` | API wrappers | fetch abstractions per backend domain |
| `client/src/config` | frontend config helpers | API URL resolution and env handling |
| `client/src/utils` | pure helper logic | theme helpers, complaint status formatting |
| `server/routes` | endpoint definitions | route handlers or route/controller bindings |
| `server/controllers` | heavier complaint/public complaint logic | domain orchestration for complaints |
| `server/models` | Mongoose schemas | persistence definitions and schema hooks |
| `server/middleware` | cross-cutting request auth | JWT verification and admin guard |
| `server/utils` | shared domain helpers | complaint workflow rules, emails, permissions |
| `server/config` | backend env normalization | config extraction and defaults |
| `server/uploads` | runtime uploaded files | complaint attachments stored on disk |

### Structural observations
- Backend is only partially layered. Most domains use route-local handlers instead of controllers/services.
- Complaint features are the most abstracted domain and use controller + utility modules.
- Frontend has both old and new API abstraction styles:
  - old: direct `fetch` inside slices and `client/src/api.js`
  - newer: `services/*` and `config/apiConfig.js`
- `client/src/components/PrivateRoute.js` appears legacy and references a missing auth context; actual routing uses `protectedRoute/*`.

## 4. Architecture Patterns

### Primary patterns in use
- Monolithic full-stack application
- REST JSON API
- Mongoose model-centric persistence
- Redux slice per feature/domain
- Route-centric backend with selective controller extraction
- Role/workflow policy encapsulated in utility modules for complaints

### Layered architecture
Observed backend flow:

```text
Route -> middleware -> controller/inline handler -> Mongoose model -> MongoDB
                               |
                               +-> utility helpers (workflow, permissions, email)
```

Observed frontend flow:

```text
Route component -> Redux thunk or service -> fetch -> Express API
```

### Dependency flow
- UI components depend on Redux slices or direct services
- Redux slices depend on `fetch` or service modules
- backend routes depend on middleware, models, and utilities
- complaint controllers depend on models and workflow/permission/email utilities
- models are leaf dependencies

### Service boundaries
This is not microservices. Logical boundaries inside the monolith are:

- Authentication/accounts
- Admin master data
- Customer/CX data
- Complaint operations
- Public complaint portal
- Dashboard analytics

### Communication patterns
- synchronous HTTP only
- no asynchronous job processing
- no message broker
- email sending is inline during request handling

### Event-driven architecture
Not present in infrastructure form. There is pseudo-event behavior implemented imperatively:

- complaint creation triggers confirmation email and history log
- complaint status update triggers status email and permission snapshot rebuild
- complaint assignment triggers assignment email and history log
- comment creation triggers comment email when public

### Shared libraries
Shared backend abstractions are limited but important:
- `complaintWorkflow.js`
- `complaintPermissionUtils.js`
- `emailService.js`
- `appConfig.js`

Shared frontend abstractions:
- `apiConfig.js`
- `apiClient.js`
- `themeUtils.js`
- complaint status formatting helpers

## 5. Backend Deep Dive

### Bootstrap and middleware

#### `server/index.js`
Responsibilities:
- load env via `dotenv/config`
- resolve config with `getAppConfig`
- configure security middleware
- expose uploads directory statically
- mount all route groups
- provide `/` and `/health`
- centralize minimal global error handling
- connect to MongoDB and start server

Security middleware stack:
- `helmet()`
- `cors(corsOptions)`
- `express.json()`
- custom sanitization:
  - `mongoSanitize.sanitize` on body/params/headers/query
  - manual recursive HTML escaping on body/params/query
- global rate limiter when enabled

Observations:
- CORS is allow-list based if origins configured; otherwise effectively open
- global error middleware only handles CORS-specialized errors and generic 500s
- no request ID, no structured logging

#### `server/config/appConfig.js`
Responsibilities:
- normalize env vars
- derive allowed CORS origins
- apply default values for port and rate limiting

Important outputs:
- `port`
- `mongoUri`
- `frontendUrl`
- `corsOrigins`
- `nodeEnv`
- `rateLimitEnabled`
- `rateLimitWindowMs`
- `rateLimitMax`

#### `server/middleware/auth.js`
Responsibilities:
- `protect`: verify Bearer JWT and attach user without password
- `adminOnly`: restrict to `req.user.role === "admin"`

Notable constraint:
- "agent" exists as a user role string in the schema, but `adminOnly` knows only admin.

### Domain models

#### `User`
Fields:
- `name`
- `email` unique, lowercase
- `password` hashed in pre-save hook
- `role` enum: `user | admin | agent`
- `userRole`: array of `UserRole` refs
- `status`: `Status` ref
- `phoneNumber`
- password reset token + expiry
- timestamps

Behavior:
- pre-save bcrypt hash if password changed
- `comparePassword`

Role model split:
- `role` is coarse global privilege
- `userRole` is fine-grained workflow/group membership

#### `Status`
Simple master data entity with unique `name`. Used by:
- users
- user roles
- role statuses
- CX models
- CX service categories
- CX data

#### `UserRole`
Master data for functional roles. Fields:
- `name`
- optional `status`

#### `RoleStatus`
Workflow mapping entity. Fields:
- `name`
- `userRole`
- `nextRoles`
- `status`

Interpretation:
- `name` is the complaint workflow state label/value
- `userRole` is a role allowed to act in that state
- `nextRoles` represent downstream handoff roles
- `status` appears to act as record activation flag; workflow utilities only honor records whose populated `status.name` normalizes to `active`

This model is central to complaint workflow authorization.

#### `CXModel`
Master data for product models. Fields:
- `name`
- optional `status`

#### `CXServiceCategory`
Master data for service categories. Fields:
- `name`
- optional `status`

#### `CXData` exported as `Customer`
Lead/customer dataset used for dashboard analytics and CRM operations.

Fields:
- `callReceiveDate`
- `customerEmail` unique
- `customerName`
- `contactNo`
- `address`
- `pincode`
- `state`
- `city`
- `model` ref `CXModel`
- `serviceCategory` ref `CXServiceCategory`
- `assignedStatus` ref `RoleStatus`
- `status` ref `Status`
- timestamps

#### `Complaint`
Primary ticket entity.

Fields:
- customer identity:
  - `customerName`
  - `customerEmail`
  - `customerPhone`
- optional `linkedCustomer`
- complaint core:
  - `title`
  - `description`
- product/service metadata:
  - `modelId`, `modelName`
  - `serviceCategoryId`, `serviceCategoryName`
- workflow:
  - `priority`
  - `status`
  - `createdBy`
  - `assignedTo`
  - `nextRoles`
  - `permissionSnapshot`
- operational:
  - `attachments`
  - `internalNotes`
  - `slaDeadline`
  - `dynamicFields`
- timestamps
- `strict: false`

Indexes:
- phone, title, priority, status, createdBy, assignedTo, SLA date
- text index on `title` + `description`

Design note:
- complaint workflow uses string `status`, not `Status` refs
- denormalized `modelName` and `serviceCategoryName` are intentionally stored alongside refs

#### `ComplaintComment`
Comment thread entries for complaints.

Fields:
- `complaintId`
- `userId` nullable for customer comments
- `customerName`, `customerEmail` for public comments
- `message`
- `isInternal`
- optional `attachments`
- timestamps

#### `ComplaintHistory`
Audit log for complaint lifecycle.

Fields:
- `complaintId`
- `action`
- `fieldName`
- `oldValue`
- `newValue`
- `message`
- `updatedBy`
- `metadata.userAgent`, `metadata.ipAddress`
- timestamps

#### `Comment`
Legacy/unintegrated model. Not referenced by current complaint routes.

### Major backend modules

#### Auth routes (`server/routes/auth.js`)
Endpoints:
- `POST /api/auth/signup`
- `POST /api/auth/login`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `GET /api/auth/me`
- `PUT /api/auth/update-profile`
- `PUT /api/auth/change-password`

Business rules:
- first-ever user becomes `admin`
- later signups default to `user`
- optional status on signup must be valid `Status`
- password reset uses raw token emailed to user, hashed token stored in DB
- reset link points to `${FRONTEND_URL}/reset-password/:token`

Dependencies:
- `User`, `Status`
- `jsonwebtoken`
- `crypto`
- `Resend`
- `protect`

Validation style:
- manual inline validation, regex-based email/phone checks
- no shared DTO or validator abstraction

#### User routes (`server/routes/users.js`)
Responsibilities:
- list users with search/filter/pagination
- bulk-create users in a Mongo transaction
- change global role / userRole array / status
- update user profile fields as admin
- delete non-admin users

Important conventions:
- always populate `userRole` and `status` in list/update responses
- excludes password via `.select("-password")`
- bulk create replicates first-user-admin behavior

Notable inconsistency:
- update route only accepts `role` in `["user","admin"]`, excluding schema value `agent`

#### Status / UserRole / CXModel / CXServiceCategory routes
Pattern:
- GET all
- POST single
- POST bulk
- PUT single
- DELETE single

Shared behavior:
- admin protection on writes
- manual duplicate checks
- optional `status` validation where applicable
- write handlers return populated docs

Differences:
- `Status` uppercases names on create/update
- `CXServiceCategory` duplicate detection is case-insensitive
- `CXModel` update expects body field `cxModel` instead of `name`

#### RoleStatus routes (`server/routes/roleStatus.js`)
This is the most important admin configuration module after users.

Capabilities:
- list all workflow mappings
- create single
- create bulk
- update single
- group-update a set of mappings by replacing/creating/deleting names
- delete single
- delete group

Business meaning:
- defines which user role can act on which complaint workflow status
- defines handoff via `nextRoles`
- feeds complaint permission snapshots and allowed status options

#### State/cities routes (`server/routes/stateCities.js`)
Responsibilities:
- fetch Indian states
- fetch cities by Indian state

External dependency:
- `https://countriesnow.space/api/v0.1/...`

Important note:
- protected but not admin-only
- no caching or timeout

#### CXData routes (`server/routes/cxData.js`)
Responsibilities:
- list customers with search/filter/sort/pagination
- create single customer
- bulk-create customers
- update customer
- delete customer
- bulk-delete customers

Validation style:
- helper `validateRef` for ObjectId existence
- manual field validation
- optional refs for model/service category/assigned status/status

Role behavior:
- reads and writes require auth
- delete and bulk delete require admin
- create/update do not require admin

#### Dashboard routes (`server/routes/dashboard.js`)
Responsibilities:
- return aggregate analytics used by dashboard widgets/charts

Endpoints:
- `/stats`
- `/revenue-analytics`
- `/customer-distribution`
- `/top-models`
- `/service-stats`
- `/recent-leads`
- `/state-distribution`
- `/analytics`
- `/trends`

Aggregation behavior:
- heavy use of MongoDB aggregation and counts
- some metrics are estimated/mock-like, for example `sales = count * 250`
- no caching

#### Complaint routes (`server/routes/complaints.js`)
Responsibilities:
- authenticated complaint CRUD
- comments
- assignment
- status updates
- history
- stats
- multer upload config for attachments

Important route-level constraints:
- `router.use(protect)` makes all complaint routes authenticated
- file size max 5 MB, up to 5 files
- accepted MIME types include images, PDF, Word, Excel, text

#### Complaint controller (`server/controllers/complaintController.js`)
This is the core business module.

Key responsibilities:
- create complaint with customer and product/service data
- validate status against acting user's allowed workflow states
- build permission snapshot from `RoleStatus` configuration
- list complaints with role-aware visibility filters
- load single complaint with history and viewer access metadata
- update fields, status, priority, assignment, internal notes, dynamic fields
- write complaint history records
- send customer and assignee emails

Role-based access model:
- admin can see all complaints
- non-admin can see complaint if:
  - they created it
  - they are assigned to it
  - one of their `userRole` ids is in snapshot allowed roles
  - one of their `userRole` ids is in `nextRoles`

Viewer metadata:
- `viewerAccess` is attached to list/detail responses for UI behavior

Workflow behavior:
- `status` values are normalized string states derived from `RoleStatus.name`
- allowed options come from active `RoleStatus` records for the user's roles
- permission snapshot is recomputed on creation and status changes

History behavior:
- every significant mutation creates `ComplaintHistory`
- changes are captured field-by-field on PATCH

Email behavior:
- create: confirmation email
- status change: status update email
- comment: comment notification if public
- assignment: assignment email to assignee

#### Public complaint controller (`server/controllers/publicComplaintController.js`)
Responsibilities:
- unauthenticated complaint creation
- complaint tracking by phone/email
- public complaint detail fetch
- public comment creation

Public security model:
- ownership check is based on `customerPhone`
- optional `customerEmail` must match if supplied
- no auth token

Workflow behavior:
- initial status is resolved from the role named similar to `Telly Calling`
- if no such role/status mapping exists, public complaint creation fails

### Utility classes/modules

#### `complaintWorkflow.js`
Responsibilities:
- normalize workflow status values
- format them for display
- identify legacy statuses
- derive allowed status options from active `RoleStatus` records
- derive public initial status option

#### `complaintPermissionUtils.js`
Responsibilities:
- extract `userRole` ids from user objects
- load workflow catalog
- build permission snapshot stored in complaints
- compute user-allowed statuses
- validate requested status against role
- resolve initial public status
- check complaint access
- attach UI-friendly access metadata

This module is the main reusable policy engine in the codebase.

#### `emailService.js`
Responsibilities:
- centralize complaint emails using Resend
- format complaint/status/comment/assignment emails

### Validation, filters, interceptors, middleware
- No Nest/Spring-style filters/interceptors.
- Validation is manual and inline.
- Middleware is limited to auth, security sanitization, rate limiting, and CORS.
- `express-validator` is installed but not currently used as the validation system.

## 6. API Documentation

### API style
- REST over JSON
- routes are mounted under `/api/*`
- auth uses Bearer token in `Authorization` header
- responses are inconsistent:
  - some endpoints return raw arrays/docs
  - some wrap with `{ message, data }`
  - some use `{ success, data }`
  - some return pagination fields at top level

Future AI should preserve current behavior within each route family unless deliberately normalizing the API.

### Authentication endpoints

| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| POST | `/api/auth/signup` | No | creates user; first user becomes admin |
| POST | `/api/auth/login` | No | returns token and populated role/status |
| POST | `/api/auth/forgot-password` | No | sends reset email if user exists |
| POST | `/api/auth/reset-password` | No | body contains raw reset token + new password |
| GET | `/api/auth/me` | Yes | returns current user |
| PUT | `/api/auth/update-profile` | Yes | updates current user's name/phone |
| PUT | `/api/auth/change-password` | Yes | requires current and new password |

### Complaint endpoints

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| POST | `/api/complaints` | Yes | create complaint |
| GET | `/api/complaints` | Yes | list complaints with filters/pagination |
| GET | `/api/complaints/status-options` | Yes | allowed workflow statuses for current user |
| GET | `/api/complaints/stats` | Yes | complaint aggregate stats |
| GET | `/api/complaints/:id` | Yes | complaint detail + history snapshot |
| GET | `/api/complaints/:id/history` | Yes | complaint history |
| PATCH | `/api/complaints/:id` | Yes | partial update |
| DELETE | `/api/complaints/:id` | Yes | delete, admin only effectively |
| POST | `/api/complaints/:id/assign` | Yes | assign complaint |
| PATCH | `/api/complaints/:id/status` | Yes | update workflow status only |
| GET | `/api/complaints/:id/comments` | Yes | get comments |
| POST | `/api/complaints/:id/comments` | Yes | add comment |

#### Complaint list query patterns
- `page`
- `limit`
- `sortBy`
- `order`
- `status` as comma-separated values
- `priority` as comma-separated values
- `category` as comma-separated values
- `assignedTo`
- `createdBy`
- `search`
- `startDate`
- `endDate`

#### Complaint request patterns
Create/update payloads commonly include:
```json
{
  "customerName": "Jane Doe",
  "customerEmail": "jane@example.com",
  "customerPhone": "9999999999",
  "title": "Display issue",
  "description": "Screen is flickering",
  "modelId": "mongodb-object-id-or-null",
  "modelName": "Optional denormalized fallback",
  "serviceCategoryId": "mongodb-object-id-or-null",
  "serviceCategoryName": "Optional denormalized fallback",
  "priority": "medium",
  "status": "workflow_state",
  "assignedTo": "user-id-or-null"
}
```

### Public complaint endpoints

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| POST | `/api/public/complaints` | No | create public complaint |
| GET | `/api/public/complaints` | No | search complaints by phone/email |
| GET | `/api/public/complaints/:id` | No | fetch complaint detail for same phone/email |
| POST | `/api/public/complaints/:id/comments` | No | add customer comment |

### User/admin endpoints

| Route group | Key endpoints |
| --- | --- |
| `/api/users` | list, bulk create, update role, update user, delete |
| `/api/statuses` | CRUD + bulk create |
| `/api/user-roles` | CRUD + bulk create |
| `/api/role-statuses` | list, create, bulk create, group update, single update, group delete, single delete |
| `/api/cx-models` | CRUD + bulk create |
| `/api/cx-service-categories` | CRUD + bulk create |
| `/api/cx-data` | list, create, bulk create, update, delete, bulk delete |
| `/api/state-cities` | states and state cities |
| `/api/dashboard` | multiple analytics endpoints |

### Validation rules summary
- email: regex-based, manual
- phone:
  - users: 10 digits if present
  - complaints/public complaints: required, trimmed, not always regex-validated server-side
  - CX data contact: 10 digits at schema level
- password: minimum 6 chars
- many ObjectId refs validated manually
- workflow status validated through complaint permission utilities

### Error response patterns
Common shapes:
```json
{ "message": "Server error" }
```
```json
{ "message": "Failed to create complaint", "error": "..." }
```
```json
{ "success": false, "message": "Failed to fetch dashboard stats" }
```

There is no single canonical error envelope.

### Pagination/filtering/sorting patterns
- implemented on `users`, `cx-data`, `complaints`
- usually query params + Mongo `.sort().skip().limit()`
- pagination metadata shape varies by endpoint

### API versioning strategy
No versioning is implemented. The API is effectively unversioned.

## 7. Database Documentation

### Database type
- MongoDB
- schema management through Mongoose models
- no migration framework found

### Entity relationships

```text
User
  -> userRole[] -> UserRole
  -> status -> Status

UserRole
  -> status -> Status

RoleStatus
  -> userRole -> UserRole
  -> nextRoles[] -> UserRole
  -> status -> Status

Customer (CXData)
  -> model -> CXModel
  -> serviceCategory -> CXServiceCategory
  -> assignedStatus -> RoleStatus
  -> status -> Status

Complaint
  -> createdBy -> User
  -> assignedTo -> User
  -> modelId -> CXModel
  -> serviceCategoryId -> CXServiceCategory
  -> nextRoles[] -> UserRole
  -> attachments[].uploadedBy -> User
  -> internalNotes[].createdBy -> User

ComplaintComment
  -> complaintId -> Complaint
  -> userId -> User

ComplaintHistory
  -> complaintId -> Complaint
  -> updatedBy -> User
```

### Constraints
- `User.email` unique
- `Status.name` unique
- `UserRole.name` unique
- `CXModel.name` unique
- `CXServiceCategory.name` unique
- `Customer.customerEmail` unique
- `RoleStatus` compound unique index on `name + userRole + status`

### Indexing
Defined indexes:
- complaints:
  - `customerPhone`
  - `title`
  - `priority`
  - `status`
  - `createdBy`
  - `assignedTo`
  - `slaDeadline`
  - compound and text indexes
- complaint comments:
  - complaint/date
  - user/date
  - complaint/internal
- complaint history:
  - complaint/date
  - updatedBy/date
- customer:
  - `callReceiveDate`
  - `status`
  - `serviceCategory`

### Audit fields
All major models use `timestamps: true`.
Complaint auditing is explicitly modeled in `ComplaintHistory`.

### Migration strategy
No formal migration strategy exists.

Implications:
- schema changes must be backward-compatible where possible
- denormalized and `strict: false` complaint documents reduce migration pressure
- manual data backfills would need scripts if model changes become substantial

### Transaction handling
- generally absent
- one notable exception: bulk user create uses a Mongoose session/transaction

## 8. Authentication & Security

### JWT flow
1. user signs up or logs in
2. backend signs JWT with `JWT_SECRET`, expiry `7d`
3. frontend stores full user payload including token in `localStorage`
4. Redux `auth` state is initialized from `localStorage`
5. protected requests send `Authorization: Bearer <token>`
6. backend `protect` middleware verifies token and loads user

### OAuth
Not present.

### Authorization flow
Authorization exists at two levels:

1. coarse role-based access using `user.role`
   - admin-only endpoints use `adminOnly`
   - some complaint actions allow admin or agent

2. fine workflow-based access using `user.userRole[]`
   - complaint visibility and status transitions depend on `RoleStatus`
   - permission snapshot is stored on complaint documents

### Token lifecycle
- JWT expiry: 7 days
- no refresh token flow
- logout is client-side only by clearing local storage

### Password reset lifecycle
- forgot-password generates random token
- raw token emailed to user
- SHA-256 hash stored in user document
- token expires in 1 hour
- reset-password endpoint validates hashed token and expiry

### Encryption/hashing
- passwords hashed with bcrypt, cost `12`
- reset token hashed with SHA-256 before persistence

### CORS setup
- backend reads allowed origins from:
  - `FRONTEND_URL`
  - `CORS_ORIGIN`
  - `ADDITIONAL_CORS_ORIGINS`
- if no allowed origins configured, all origins are effectively accepted

### Security filters and middleware
- `helmet`
- rate limiting in production by default
- `express-mongo-sanitize`
- manual recursive XSS escaping of string fields
- protected routes require valid JWT

### File upload security
- multer MIME allow-list
- size limits configured
- uploads served statically under `/uploads`

### Security concerns from audit
- CORS becomes permissive when origins are not configured
- no refresh token rotation or session invalidation
- public complaint access relies on phone number and optional email only
- no brute-force login protection beyond global rate limit
- no content scanning or antivirus for uploads
- uploaded files are publicly accessible if filename is known under `/uploads`

## 9. Configuration Management

### Frontend env
`client/.env.example`
- `VITE_API_URL=http://localhost:5000`

Behavior:
- if `VITE_API_URL` exists, frontend normalizes it and appends `/api` if missing
- in dev with no env, frontend uses Vite proxy `/api`
- in production with no env, frontend defaults to `<window.origin>/api`

### Backend env
`server/.env.example`
- `MONGO_URI`
- `PORT`
- `NODE_ENV`
- `JWT_SECRET`
- `FRONTEND_URL`
- `CORS_ORIGIN`
- `ADDITIONAL_CORS_ORIGINS`
- `RESEND_API_KEY`
- `EMAIL_FROM`
- `RATE_LIMIT_ENABLED`
- `RATE_LIMIT_WINDOW_MS`
- `RATE_LIMIT_MAX`
- `MAX_FILE_SIZE_MB`
- `ALLOWED_FILE_TYPES`

Note:
- only some env vars are actually consumed in code
- `MAX_FILE_SIZE_MB` and `ALLOWED_FILE_TYPES` are documented but route upload logic currently hardcodes limits/types

### Profiles / environments
No profile system beyond `NODE_ENV`.

Known environments implied by files:
- local development
- Vercel frontend deployment
- Render backend deployment
- Railway backend deployment

### Ports
- frontend dev: `5173`
- backend default: `5000`
- Render backend production: `10000`

### Secrets handling
- plain `.env` files locally
- Render comments instruct setting env vars in provider UI
- no vault/secret manager abstraction in code

## 10. Coding Standards & Conventions

### Naming conventions
- frontend components/pages: PascalCase file names
- frontend utilities/services/slices: camelCase file names
- backend route/model/util files: camelCase / Pascal singular entity naming
- REST resource names:
  - pluralized kebab-case paths like `/user-roles`, `/role-statuses`
- Mongo fields:
  - mostly camelCase

### Package/module structure conventions
- frontend groups by technical role first, then feature (`pages`, `components`, `redux/slices`)
- backend groups by runtime role first (`routes`, `models`, `utils`, `controllers`)

### DTO patterns
No explicit DTO layer exists.
Request/response contracts are implicit in route/controller code.

### Response wrapper conventions
Inconsistent by module:
- master data routes often return raw documents/arrays
- complaints use `{ message, data, ... }`
- dashboard uses `{ success, data }`
- users/CX data use mixed top-level pagination fields

Future work should preserve local conventions within a module unless executing an intentional standardization project.

### Error handling style
- route-local `try/catch`
- log with `console.error`
- return HTTP status + simple JSON message
- no typed error classes or centralized business error mapping

### Logging style
- plain `console.log` / `console.error`
- no correlation IDs
- no log levels beyond human intent

### Exception strategy
- catch and respond close to source
- global fallback only in `server/index.js`
- frontend often logs and shows toast/rejected thunk message

### Validation style
- mostly manual inline checks
- regex checks for email/phone
- ObjectId validation via `mongoose.Types.ObjectId.isValid`
- schema validation used as secondary layer

### Code organization principles inferred
- keep CRUD together per route file
- use controller extraction only when domain grows complex
- duplicate small validation logic instead of introducing shared validators
- use Redux thunks directly from UI for async stateful operations

## 11. Reusable Development Patterns

### Backend CRUD pattern
Typical master-data route structure:
1. GET all
2. validate input
3. check duplicate
4. validate optional refs
5. create/update
6. repopulate related refs
7. return created/updated doc

Future modules that resemble `Status`, `UserRole`, `CXModel`, or `CXServiceCategory` should follow this shape.

### Bulk operation pattern
Common pattern:
- endpoint `/bulk`
- payload contains plural array
- trim and dedupe names or rows
- validate refs first
- reject if all entries already exist
- `insertMany`
- fetch inserted docs again with population

### Complaint workflow pattern
For any feature that must follow workflow/role rules:
1. resolve acting user's `userRole` ids
2. derive allowed states from active `RoleStatus`
3. validate requested state using utility
4. build/store snapshot for future access checks
5. log change history

### Pagination pattern
Common fields:
- `page`
- `limit`
- `sort`
- `order`
- `search`

Backend uses Mongo skip/limit. Frontend stores `page`, `total`, `totalPages`.

### Response model pattern
No universal wrapper, but domain-local patterns exist:
- complaint domain: `message + data + extra metadata`
- dashboard: `success + data`
- master data: raw docs

### Utility helper pattern
The codebase only extracts helpers when the logic is:
- shared across routes/controllers
- likely to become policy-heavy
- formatting-centric

Examples:
- workflow normalization
- permission snapshot derivation
- theme application
- API URL normalization

### Common annotations/base entities
Not applicable in Java/Spring sense. Closest analogs:
- Mongoose timestamps
- repeated manual `protect` / `adminOnly`

### Shared interceptor equivalent
Global express middleware stack in `server/index.js`.

### How future features should follow these patterns
- add new domain route files under `server/routes`
- only extract controller/service/util when logic becomes multi-step or reused
- validate ObjectIds and foreign refs explicitly
- populate refs in admin-facing responses
- if workflow-sensitive, reuse complaint permission utility style rather than ad hoc role checks
- on frontend, add a Redux slice if the feature has async state and list/detail UI
- prefer `config/apiConfig.js` for base URL derivation

## 12. Frontend Documentation

### Routing
Defined in `client/src/App.jsx`.

Public routes:
- `/login`
- `/signup`
- `/forgot-password`
- `/reset-password/:token`
- `/complaint-form`
- `/track-complaint`

Authenticated routes:
- `/`
- `/profile`
- `/cx-data`
- `/complaints`
- `/complaints/new`
- `/complaints/:id`

Admin-only routes:
- `/admin`
- `/admin/status`
- `/admin/user-roles`
- `/admin/role-statuses`
- `/admin/cx-models`
- `/admin/cx-service-categories`

### Layout system
- auth pages wrapped in `AuthLayout`
- authenticated/admin pages wrapped in `AppShell`
- `AppShell` contains `Sidebar` + `Topbar` + content area
- sidebar collapsed state persisted in local storage

### State management
Redux Toolkit store domains:
- `auth`
- `users`
- `statuses`
- `userRoles`
- `roleStatuses`
- `stateCities`
- `cxModels`
- `cxServiceCategories`
- `cxData`
- `dashboard`
- `theme`
- `complaints`

### API integration pattern
There are three patterns currently in use:

1. direct `fetch` inside Redux thunks
2. service modules wrapping `fetch`
3. generic `apiClient.js` abstraction

The codebase is not fully standardized. New work should prefer:
- `config/apiConfig.js` for base URL
- either service module + thunk or direct thunk fetch consistently within that feature

### Form handling
- local component state via `useState`
- manual validation in component before dispatch/request
- no form library

### Authentication flow
- login/signup thunks call backend
- user object with token persisted in `localStorage`
- `ProtectedRoute` checks existence of `state.auth.user`
- `AdminRoute` checks `user.role === "admin"`
- logout clears store and local storage

### Protected routes
Active route guards:
- `protectedRoute/ProtectedRoute.jsx`
- `protectedRoute/AdminRoute.jsx`

Legacy route guard:
- `components/PrivateRoute.js` appears stale and references missing context API

### Theme/layout system
- `themeSlice` stores `light/dark`
- `ThemeInitializer` applies theme to document
- `themeUtils.js` writes theme attributes / local storage
- topbar provides theme toggle

### Reusable UI system
Main reusable components:
- `AppShell`
- `Sidebar`
- `Topbar`
- complaint subcomponents:
  - `ComplaintTimeline`
  - `CommentsModal`
  - `ComplaintCard`
  - `ComplaintList`
  - `ComplaintForm`
- common components:
  - `Modal`
  - `Skeleton`

### Complaint UI patterns
- list screen supports quick inline filtering and modal/sidebar editing
- detail screen supports workflow actions and history
- public screens use dedicated services and independent local state

## 13. DevOps & Deployment

### Local development
Root scripts:
- `npm run install-all`
- `npm run dev`

`npm run dev` starts:
- backend with `node index.js`
- frontend with `vite`

Frontend proxy:
- Vite proxies `/api` to `http://localhost:5000`

### Deployment files

#### Frontend
`client/vercel.json`
- build command: `npm run build`
- output directory: `dist`
- install command: `npm install`

Likely deployment target: Vercel static hosting.

#### Backend
`server/render.yaml`
- service type: web
- env: node
- region: oregon
- plan: free
- build: `npm install`
- start: `npm start`

`server/railway.json`
- builder: `nixpacks`

`server/Procfile`
- `web: node index.js`

### Environment separation
Implied only by different platform env settings.
No dedicated config modules per environment beyond env vars.

### Containerization
None found.

### CI/CD
No GitHub Actions or other CI files found.
Deployments appear provider-driven from connected repo.

### Scaling strategy
No explicit scaling strategy in code.
Current design is suitable for small-to-moderate traffic:
- stateless JWT auth
- MongoDB backing store
- local disk uploads create horizontal scaling limitations unless shared storage is introduced
- synchronous email sending adds request latency

## 14. Known Technical Debt

### Architecture / consistency
1. API response shapes are inconsistent across modules.
2. Backend mixes route-local business logic and controller-based logic without a clear threshold.
3. Frontend has multiple competing API access patterns (`api.js`, service modules, direct thunk fetches, `apiClient.js`).

### Likely bugs or mismatches
1. `ComplaintDetail.jsx` still references `current.category`, but current complaint schema uses `serviceCategoryName` / `serviceCategoryId`.
2. `complaintService.buildFormDataForComplaint` still appends `category`, not the newer service category fields.
3. `deleteComplaintAction` expects `"Complaint deleted"` while backend returns `"Complaint deleted successfully"`, which can produce false rejections.
4. `Complaint.linkedCustomer` references `Customer`, but public complaint creation looks up a `User` by phone number and stores that id there. This is a type/model mismatch.
5. `components/PrivateRoute.js` references a `useAuth` context that is not part of the active architecture.
6. `client/src/api.js` is legacy and duplicates user/auth API logic.

### File upload / attachment debt
1. Complaint routes configure multer and accept files, but complaint controllers do not map `req.files` or `req.file` into `Complaint.attachments`.
2. Public complaint route uses `upload.single("attachment")`, but frontend submits JSON and controller ignores files.
3. Uploads can be written to disk without any corresponding complaint attachment metadata, creating orphaned files.

### Security concerns
1. If CORS origins are not configured, API accepts any origin.
2. Public complaint ownership is weakly protected by phone number and optional email only.
3. Uploads are served statically from local disk.
4. No audit or anomaly monitoring around auth failures or public complaint access attempts.

### Workflow / domain debt
1. Global user `role` and array `userRole` create overlapping privilege models.
2. `agent` exists in schema, but admin user update route rejects it.
3. Complaint status system still has legacy state handling in UI utilities while newer workflow is role-driven via `RoleStatus`.

### Performance bottlenecks
1. Dashboard analytics run multiple sequential queries and aggregations with no caching.
2. Some dashboard endpoints loop month-by-month with repeated database queries instead of aggregating in one pipeline.
3. External states/cities API calls are uncached.
4. Email sending occurs inline during request lifecycle.

### Testing debt
1. No meaningful backend tests found.
2. No meaningful frontend tests found.
3. Package scripts reference tests, but repository does not appear to include real coverage.

## 15. AI Development Guidelines

### General rules future AI must follow
1. Treat this as a JavaScript monolith, not a microservice system.
2. Prefer incremental changes that fit the existing route/slice/module boundaries.
3. Do not introduce TypeScript-only patterns unless migrating the whole project.
4. Preserve route naming, response style, and auth model within each existing domain unless doing an intentional standardization pass.

### Backend rules
1. Add new endpoints under `server/routes/<domain>.js`.
2. Use `protect` for authenticated endpoints and `adminOnly` only where true admin exclusivity is intended.
3. Validate foreign keys with `mongoose.Types.ObjectId.isValid` plus existence queries.
4. When a feature is complaint-workflow-sensitive, reuse `complaintPermissionUtils.js` instead of inventing parallel access logic.
5. If a new complaint mutation matters to operations, create a `ComplaintHistory` record.
6. If a complaint/customer-facing update should notify users, add email handling through `server/utils/emailService.js`.
7. Keep request validation manual and explicit unless the project is being deliberately upgraded to a shared validation layer.

### Frontend rules
1. Add page routes in `client/src/App.jsx`.
2. Wrap authenticated pages in `ProtectedRoute` + `AppShell`.
3. Wrap admin-only pages in `AdminRoute` + `AppShell`.
4. Add Redux slices for features that need async list/detail state, loading, and error handling.
5. Use `getApiBaseUrl()` from `client/src/config/apiConfig.js`.
6. Preserve current local-storage auth persistence pattern unless refactoring the auth subsystem.
7. Reuse complaint status formatting helpers for UI badges and labels.

### Naming conventions AI must preserve
- React pages/components: PascalCase
- slice/service/util filenames: camelCase
- API resources: plural kebab-case
- Mongo fields: camelCase

### Response structure standards
Because the project is inconsistent, AI should follow local precedent:
- complaint endpoints: `message`, `data`, optional metadata
- dashboard endpoints: `success`, `data`
- master data endpoints: raw arrays/docs

### Validation standards
- perform manual required-field checks near handler entry
- validate email and phone formats explicitly when applicable
- validate ObjectIds before queries
- reject duplicate names/emails where current modules already do so

### Security requirements
- authenticated writes should use `protect`
- admin-only configuration changes should use `adminOnly`
- complaint status changes must be validated against allowed workflow states
- never trust frontend-submitted role/userRole/status ids without DB validation

### Logging requirements
- continue using `console.error`/`console.log` unless a logging layer is introduced
- include route/domain context in error messages

### Testing expectations
Current repo has little coverage, but future AI should still:
- add focused unit/integration tests when introducing reusable business logic
- prioritize complaint workflow and auth tests if testing investment begins
- verify manually with route-specific smoke paths when tests are absent

## 16. Future Feature Integration Strategy

### How to safely add new APIs
1. Choose the nearest existing domain route file.
2. Follow the domain's existing response shape.
3. Add auth/role middleware first.
4. Add explicit validation.
5. Populate refs in admin-facing responses.
6. Update frontend service/thunk/page in the same domain.

### How to add new backend modules
Recommended pattern:
1. create `server/models/NewEntity.js`
2. create `server/routes/newEntities.js`
3. mount in `server/index.js`
4. optionally add `server/controllers` or `server/utils` only if logic is complex/shared
5. add frontend slice + admin page if it is managed through UI

### How to add new database tables/collections
Because there is no migration system:
1. add the Mongoose schema
2. keep fields optional when possible during rollout
3. prefer backward-compatible reads
4. add indexes in schema if new queries depend on them
5. create one-off scripts if historical backfill is needed

### How to add new frontend pages
1. create page component under `client/src/pages` or `pages/AdminPages`
2. add route in `App.jsx`
3. wrap with correct guard/layout
4. add navigation item in `Sidebar.jsx` if it is user-facing
5. add slice/service only if data loading is non-trivial

### How to extend authentication
1. keep JWT Bearer model unless auth subsystem is intentionally redesigned
2. add new account endpoints in `server/routes/auth.js`
3. update `authSlice.js` and `ProtectedRoute` behavior if auth payload changes
4. preserve compatibility with `localStorage`-stored `user`

### How to extend authorization
1. decide whether access belongs to coarse `role` or fine `userRole`
2. use `role` for global admin/staff privileges
3. use `userRole + RoleStatus` for workflow permissions
4. if complaint workflow changes, update:
   - `RoleStatus` data model usage
   - `complaintWorkflow.js`
   - `complaintPermissionUtils.js`
   - UI status option consumers

### How to maintain backward compatibility
1. do not remove old response fields casually, especially in complaint and dashboard payloads.
2. keep complaint documents tolerant of legacy states while workflow migration is incomplete.
3. when renaming payload fields, support both old and new fields temporarily if the frontend is not upgraded atomically.
4. avoid changing auth payload shape without updating persisted local-storage user handling.

## Assumptions and Gaps

### Assumptions made during this audit
- `.env` files were not treated as authoritative sources for actual secret values; only variable names and examples were used.
- No hidden deployment or CI system exists outside the repository.
- `Comment.js` and `components/PrivateRoute.js` are legacy because they are not part of current active flows.
- Test scripts exist mainly as placeholders because corresponding test files were not found.

### Areas future AI should verify before major changes
- whether `agent` role is actively used in production
- whether uploads are intended to be fully supported or can be removed
- whether `linkedCustomer` should point to `User` or `Customer`
- whether API response standardization is desired before adding more endpoints
- whether public complaint tracking should remain phone-based or move to signed tracking tokens
