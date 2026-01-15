# AccesstrvlBD



````markdown name=README.md url=https://github.com/elusive08/Accesstrvlbd-APIV2/blob/main/README.md
# ACCESS-TRAVEL API (Accesstrvlbd-APIV2)

A RESTful Node.js / Express API for storing, searching and managing accessibility information about places, reviews, user accessibility profiles and trip planning. The API is backed by MongoDB and implements authentication, email verification, reporting and basic admin moderation endpoints.

> Repository: https://github.com/elusive08/Accesstrvlbd-APIV2

---

## Key features

- User authentication (register, email OTP verification, login, profile)
- Place creation, update and retrieval
- Public and personalized place search using accessibility filters or a user's accessibility profile
- Reviews, review voting (helpful / inaccurate), and reporting of problematic content
- Accessibility feature catalogue (features grouped by category)
- Accessibility profiles for users and a trip planner that suggests places
- Admin endpoints for moderation (reports, review/place moderation)
- Email support (OTP verification) using configured email provider

---

## Tech stack

- Node.js (CommonJS)
- Express
- MongoDB (mongoose)
- Authentication: JSON Web Tokens (jsonwebtoken)
- Password hashing: bcryptjs
- Email: nodemailer / configurable provider
- Environment management: dotenv

Dependencies are declared in `package.json`. Scripts:
- `npm start` — start server (node server.js)
- `npm run dev` — start with nodemon for development

---

## Repository structure 

- server.js — application entry (loads env, starts express app)
- src/
  - app.js — express app, route mounting and DB connection
  - config/
    - db.js — MongoDB connection
  - controllers/ — request handlers (auth, place, review, admin, search, trips, accessibility features, etc.)
  - models/ — Mongoose models (User, Place, Review, Trip, AccessibilityFeature, AccessibilityProfile, etc.)
  - routes/ — route definitions mounted in app
  - middleware/ — auth, role, and other middleware
  - services/ — helper services (trip planner, search helpers, etc.)
  - utils/ — utilities (email sending, token generation, etc.)
- package.json / package-lock.json
- test-email.js — quick script to test email sending (example)

---

## Quick start — local development

Prerequisites
- Node.js (16+ recommended)
- npm
- MongoDB (local or connection URI to hosted MongoDB) which we use in this case

1. Clone the repository
   git clone https://github.com/elusive08/Accesstrvlbd-APIV2.git
   cd Accesstrvlbd-APIV2

2. Install dependencies
   npm install

3. Create a `.env` file in project root with required environment variables. Example:

   PORT=5000
   MONGO_URI=mongodb+srv://<user>:<password>@cluster0.mongodb.net/access-travel?retryWrites=true&w=majority
   JWT_SECRET=your_jwt_secret_here
   # Optional / email provider settings used by utils/sendEmail
   # EMAIL_HOST=smtp.example.com
   # EMAIL_PORT=587
   # EMAIL_USER=user@example.com
   # EMAIL_PASS=supersecret

4. Run server (development)
   npm run dev

5. Server listens on `PORT` (default 5000). Example:
   http://localhost:5000

---

## Environment variables

At minimum the app expects:

- MONGO_URI — MongoDB connection string
- JWT_SECRET — secret used to sign JWT tokens
- PORT —server port, default 5000

Email variables depend on the chosen email provider; `utils/sendEmail` uses the configured provider. Configure SMTP or other provider credentials there (or via env vars if implemented).

---

## Authentication

- Registration flow uses email OTP verification:
  - POST /auth/register — create account (sends OTP via email)
  - POST /auth/verify-email — verify OTP to confirm email
  - POST /auth/login — login and receive JWT
  - GET /auth/me — get current user (protected)

Protected routes require the Authorization header:
Authorization: Bearer <token>

---

## API Endpoints (summary)

Routes are mounted in `src/app.js`. The following are the endpoints implemented by the project (path names reflect how routes are mounted in the current code):

Auth
- POST /auth/register — register a new user (returns token + user summary)
- POST /auth/verify-email — verify email OTP
- POST /auth/login — login
- GET /auth/me — protected, get current user

Places
- POST /places/create — protected only registeed users, create a new place
- PUT /places/update/:id — protected, update a place (owner or admin)
- GET /places/search — public search (filters)
  - Query params: wheelchair, visual, hearing, serviceAnimal, category, city
- GET /places/:id — get place by ID

Personalized / authenticated search
- GET /api/places/search — protected; uses user's accessibility profile (if present) to build search filters; manual query params still supported

Reviews
- POST /reviews/add — protected, add review for a place
- GET /reviews/place/:id — public, get reviews for a place

Review voting
- POST /api/reviews/:id/vote — protected, vote on a review (helpful / inaccurate) — returns trust score

Reporting & Admin
- POST /api/reports — protected, submit a report
- Admin routes (require `admin` authorization):
  - GET /api/admin/admin/reports — get pending reports
  - PUT /api/admin/admin/reports/:id — resolve report
  - GET /api/admin/reviews — admin reviews endpoint (placeholder)
  - GET /api/admin/places — admin places endpoint (placeholder)
  - Note: some admin routes include an extra `admin` path segment due to how route files are defined; check `src/routes/admin.routes.js` and `app.js` mount points for exact path in your running instance.

Accessibility features
- POST /accessibility-features — create feature (intended for admin)
- GET /accessibility-features — list all features
- GET /accessibility-features/:category — get features by category

Accessibility profile
- POST /profile/create — protected, create user's accessibility profile
- PUT /profile/update — protected, update profile
- GET /profile/get — protected, get user profile

Trips / Trip planner
- POST /trips/create — protected, create a trip (associates accessibility profile)
- GET /trips/suggestions — protected, get place suggestions for a destination
- GET /trips/:id — protected, get trip details

Notes about routes and some under top-level paths (e.g., `/places`, `/trips`). The exact path for some admin endpoints includes a duplicated `/admin` segment due to how those routes are defined and mounted; see `src/app.js` and `src/routes/*` for precise mounting in your version.

---

## Request / Response examples

Register (example)
curl -X POST http://localhost:5000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Jane Doe","email":"jane@example.com","password":"P@ssw0rd"}'

Login (example)
curl -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"jane@example.com","password":"P@ssw0rd"}'

Search places (public)
GET http://localhost:5000/places/search?wheelchair=true&city=London

Search places (authenticated — uses profile)
GET http://localhost:5000/api/places/search
Headers: Authorization: Bearer <token>

Create place (protected)
POST http://localhost:5000/places/create
Headers: Authorization: Bearer <token>
Body: JSON place object (see Place model summary below)

---

## Data model summaries (high-level)

The project uses Mongoose models. Below are the main domain models and their purpose:

- User
  - name, email, password (hashed), role (user/admin), isEmailVerified, email OTP fields
- Place
  - name, description, location (city, address, coordinates), category, createdBy, accessibility object (wheelchair, visual, hearing, serviceAnimal, braille, captions, etc.), verificationStatus, createdAt
- Review
  - user, place, accessibilityRatings (structured), structuredQuestions, dateOfVisit, comment, photos, helpfulCount, inaccurateCount, trustScore
- ReviewVote
  - review, user, vote ("helpful" | "inaccurate")
- AccessibilityFeature
  - name, category, description
- AccessibilityProfile
  - user reference, mobility/visual/hearing settings, serviceAnimal preference, etc. — used to personalize search and trip suggestions
- Trip / TripStop
  - Trip: user, destination, dates, accessibilityProfile, stops
  - TripStop: references to places suggested/visited in a trip
- Report
  - submitted by user referencing review/place, reason, status (pending/resolved)

For exact schemas, see the model files in `src/models/`.

---

## Error handling & validation

Controllers generally return JSON responses with `{ success: boolean, message?, data?, error? }`. Status codes are used for common cases (200, 201, 400, 401, 403, 404, 500). Client input should be validated before submission; the API includes some server-side checks for required fields, existence checks, and authorization checks for protected actions.

---

## Development notes & TODOs (observations from current code)

- There are a few duplicated route mounts and route path segment duplications (for example admin routes are mounted under `/api` but the route file defines `/admin/...` segments as well). Verify route mounts in `src/app.js` and consider simplifying route paths to avoid duplicated segments.
- There are multiple search routes — one public and one authenticated that leverages a user's accessibility profile. Confirm intended behavior and harmonize if necessary.
- Email sending is wired to an email utility — ensure SMTP or a provider is properly configured in environment variables for OTP delivery.
- Add automated tests — current repository contains no test suite. Look at `test-email.js` as an example helper for testing email configuration.

---

## Contributing

Thank you for considering contributing. Suggested steps:

1. Fork the repository.
2. Create a feature branch: `git checkout -b feat/some-feature`
3. Implement changes, add tests where applicable.
4. Open a pull request describing the change and motivation.

Please follow consistent code style (CommonJS modules, async/await, error handling) and include tests for new functionality where possible.

---
---

## Contact / Maintainer

Repository owner: elusive08  
For questions, open an issue in the repository with clear reproduction steps or design discussion.

---

Thank you for using ACCESS-TRAVEL API
````
