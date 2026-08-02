# pw-Restful-Booker-test

[![Playwright Tests](https://github.com/InfoAdam1998/pw-Restful-Booker-test/actions/workflows/playwright.yml/badge.svg)](https://github.com/InfoAdam1998/pw-Restful-Booker-test/actions/workflows/playwright.yml)

API test automation for the [Restful-Booker](https://restful-booker.herokuapp.com/) API, built with **Playwright** and **TypeScript**. The suite covers the full CRUD lifecycle of a booking (create, read, update, delete), token-based authentication, and negative/error-path testing — organised with an API client class, custom fixtures, and a test-data builder, and run automatically in CI via GitHub Actions.

---

## What this project demonstrates

- **API testing fundamentals** — sending HTTP requests and asserting on status codes and JSON response bodies, with no browser or UI involved.
- **Full CRUD coverage** — `GET`, `POST`, `PUT`, `PATCH`, and `DELETE` against the booking resource.
- **Token-based authentication** — fetching an auth token and using it to authorise protected endpoints.
- **API client pattern** — a `BookingApi` class encapsulates every endpoint call, so tests express intent (`createBooking(...)`) rather than raw HTTP mechanics. This is the API equivalent of the Page Object Model.
- **Custom fixtures** — a ready-constructed `BookingApi` and a valid auth token are injected into any test that needs them.
- **Test-data builder** — a `makeBooking()` factory generates valid payloads with per-test overrides, keeping tests concise and readable.
- **Test independence** — every test creates its own data (the API resets every 10 minutes and is shared), so no test depends on pre-existing records.
- **Negative & bug-hunting tests** — invalid IDs, missing authentication, and malformed payloads, including a **real defect documented with `test.fail()`** (see below).
- **Secrets management** — credentials are read from environment variables (a git-ignored `.env` locally, GitHub Secrets in CI); no credentials are committed.
- **Continuous Integration** — every push and pull request runs the full suite on GitHub Actions.

---

## Tech stack

- [Playwright Test](https://playwright.dev/) (`@playwright/test`) — using its API testing capabilities (`request` fixture)
- TypeScript
- [dotenv](https://www.npmjs.com/package/dotenv) for local environment variables
- GitHub Actions for CI

---

## Project structure

```
pw-Restful-Booker-test/
├── .github/
│   └── workflows/
│       └── playwright.yml        # CI pipeline (runs on push / pull request)
├── api/
│   └── BookingApi.ts             # API client: wraps every endpoint call
├── fixtures/
│   └── test-options.ts           # custom fixtures: bookingApi + auth token
├── utils/
│   └── testData.ts               # makeBooking() test-data builder
├── tests/
│   ├── auth.spec.ts              # POST /auth (token + rejected credentials)
│   ├── create-booking.spec.ts    # POST /booking
│   ├── read-bookings.spec.ts     # GET /ping, /booking, /booking/:id, filtering
│   ├── update-delete-booking.spec.ts  # PUT, PATCH, DELETE
│   └── negative.spec.ts          # unauthorised, not-found, malformed input
├── playwright.config.ts          # baseURL, single project, dotenv
├── .env                          # local credentials (git-ignored, not committed)
├── package.json
└── README.md
```

### Design notes

- **`api/BookingApi.ts`** owns all endpoint paths and request mechanics (headers, the auth cookie, request bodies). Methods return the response so the *test* performs the assertions — the client handles the *how*, the test verifies the *what*. If an endpoint path or the auth header format changes, it changes in one place.
- **`fixtures/test-options.ts`** provides a `bookingApi` fixture (a constructed client) and a `token` fixture (a fetched auth token). Tests request whichever they need as arguments instead of building them by hand. The `token` fixture is deliberately **not** used by `auth.spec.ts` — those tests verify authentication itself, so they exercise `/auth` directly rather than through the mechanism under test.
- **`utils/testData.ts`** holds `makeBooking(overrides)`, which returns a valid default booking and applies any overrides on top. It is used for valid payloads; tests that require *missing* or *partial* data (the missing-field and PATCH tests) construct their payloads inline, because the builder's defaults would otherwise fill in the very fields those tests need absent.
- **Single project** — the suite runs one project rather than cross-browser, because API responses are browser-independent, so running across browsers would add cost without adding coverage.

---

## Endpoints under test

| Method | Endpoint | Auth | Notes |
| --- | --- | --- | --- |
| GET | `/ping` | no | health check (returns 201) |
| POST | `/auth` | no | returns an auth token |
| GET | `/booking` | no | list all IDs; supports `?firstname=`/`?lastname=` filtering |
| GET | `/booking/:id` | no | single booking |
| POST | `/booking` | no | create |
| PUT | `/booking/:id` | token | full update |
| PATCH | `/booking/:id` | token | partial update |
| DELETE | `/booking/:id` | token | delete (returns 201) |

---

## Bugs found

**`POST /booking` returns `500` instead of `400` for missing required fields.**
When a booking is created without a required field (e.g. `firstname`), a well-behaved API should reject it with a `400 Bad Request` and a validation message. Instead, the API responds with a `500 Internal Server Error` — it does not validate input gracefully and errors out on the server. This is documented in `tests/negative.spec.ts` with `test.fail()`, so the suite records the expected (correct) behaviour while acknowledging the defect; if the API is fixed, the test will flag that the marker can be removed.

---

## Getting started

### Prerequisites

- [Node.js](https://nodejs.org/) (LTS)
- npm

### Installation

```bash
git clone https://github.com/InfoAdam1998/pw-Restful-Booker-test.git
cd pw-Restful-Booker-test

npm ci
npx playwright install
```

### Environment variables

Create a `.env` file in the project root (git-ignored, never committed):

```
ADMIN_USER=admin
ADMIN_PASSWORD=password123
```

> These are Restful-Booker's public admin credentials. Reading them from environment variables mirrors real-world secret handling — the same test code reads from `.env` locally and from GitHub Secrets in CI.

---

## Running the tests

```bash
# run the whole suite
npx playwright test

# run a single spec
npx playwright test create-booking

# open the last HTML report
npx playwright show-report
```

> The Restful-Booker API is a shared, public sandbox that resets every 10 minutes. Every test creates the data it needs, so tests remain independent and reset-proof.

---

## Continuous Integration

The pipeline in [`.github/workflows/playwright.yml`](.github/workflows/playwright.yml) runs on every push and pull request to `main` / `master`. It installs dependencies and browsers, runs the suite, and uploads the HTML report as an artifact.

Credentials are provided through **GitHub repository secrets** (`Settings → Secrets and variables → Actions`), injected into the test step as environment variables. Because `.env` is git-ignored, no credentials reach the repository.

Required secrets:

- `ADMIN_USER`
- `ADMIN_PASSWORD`

---

## License

MIT
