# pw-Restful-Booker-test

[![Playwright Tests](https://github.com/InfoAdam1998/pw-Restful-Booker-test/actions/workflows/playwright.yml/badge.svg)](https://github.com/InfoAdam1998/pw-Restful-Booker-test/actions/workflows/playwright.yml)

API test automation for the [Restful-Booker](https://restful-booker.herokuapp.com/) API, built with **Playwright** and **TypeScript**, plus a **k6** performance-testing suite. The functional suite covers the full CRUD lifecycle of a booking (create, read, update, delete), token-based authentication, and negative/error-path testing — organised with an API client class, custom fixtures, and a test-data builder, and run automatically in CI via GitHub Actions. The k6 suite load-tests the same API to measure how it behaves under concurrent traffic.

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
- **Performance / load testing with k6** — smoke, load, and CRUD-journey scenarios with quality-gate thresholds, per-endpoint tagging, and authentication under load.
- **Secrets management** — credentials are read from environment variables (a git-ignored `.env` locally, GitHub Secrets in CI); no credentials are committed.
- **Continuous Integration** — every push and pull request runs the full suite on GitHub Actions.

---

## Tech stack

- [Playwright Test](https://playwright.dev/) (`@playwright/test`) — using its API testing capabilities (`request` fixture)
- TypeScript
- [k6](https://k6.io) for performance / load testing
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
├── performance/                  # k6 performance-testing suite (see below)
│   ├── config/
│   │   ├── thresholds.js         # shared pass/fail quality gates
│   │   └── scenarios.js          # reusable load profiles (smoke/load/stress/spike)
│   └── tests/
│       ├── smoke.test.js
│       ├── load.test.js
│       ├── reads-tagged.load.test.js
│       ├── create-booking.load.test.js
│       ├── update-booking.load.test.js
│       └── booking-journey.load.test.js
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
- [k6](https://k6.io) (for the performance suite) — install via `winget install k6`, `choco install k6`, or from the [k6 releases page](https://github.com/grafana/k6/releases)

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

## Performance Testing (k6)

In addition to the functional suite, the API is load-tested with [k6](https://k6.io) to measure how it behaves under concurrent traffic — a dimension functional tests don't cover.

### Structure

```
performance/
├── config/
│   ├── thresholds.js     # shared pass/fail quality gates (p95 latency, error rate)
│   └── scenarios.js      # reusable load profiles (smoke, load, stress, spike)
└── tests/
    ├── smoke.test.js               # 1-VU sanity check (GET /booking)
    ├── load.test.js                # ramping load to 20 VUs (GET /booking)
    ├── reads-tagged.load.test.js   # per-endpoint tagged thresholds (list vs single)
    ├── create-booking.load.test.js # write load (POST /booking)
    ├── update-booking.load.test.js # authenticated write load (PUT + setup() token)
    └── booking-journey.load.test.js# full CRUD journey (create -> read -> update -> delete)
```

### Concepts demonstrated

- **Load profiles** — smoke, load, stress, and spike scenarios, centralized in `config/scenarios.js` so tests import a profile rather than redefining stages.
- **Thresholds as quality gates** — p95 latency and error-rate limits in `config/thresholds.js`; k6 exits non-zero if breached, making it CI-ready.
- **Checks** — per-request validation of status and body under load.
- **`setup()` lifecycle** — authenticating once and sharing the token across all virtual users, rather than re-authenticating on every request.
- **Per-endpoint tags & differentiated thresholds** — the heavier list endpoint and the lighter single-booking endpoint are tagged and held to separate gates (`p(95)<900` vs `p(95)<700`).
- **A realistic CRUD journey** — one virtual user performs create -> read -> update -> delete in sequence, grouped for per-step reporting, with each VU owning its own data to avoid collisions under concurrency.

### Key findings

- **Reads degrade under load.** `GET /booking` p95 rose from ~310ms (1 user) to ~735ms (20 users) — roughly doubling — while staying within error-rate limits.
- **Endpoint size matters.** The list endpoint (all bookings) is consistently slower than a single booking (p95 ~735ms vs ~450ms under load), which is why the two are held to different thresholds.
- **Writes are strong but variable.** The authenticated update endpoint was the best performer (p95 ~186ms, zero failures at 20 VUs); the create endpoint occasionally showed tail-latency spikes, and the shared public demo intermittently rate-limits writes with HTTP 418.

### Running the performance tests

```bash
# smoke test (quick sanity check, 1 user)
k6 run performance/tests/smoke.test.js

# a load test (ramps to 20 concurrent users)
k6 run performance/tests/load.test.js

# override the profile for a quick custom run
k6 run --vus 5 --duration 30s performance/tests/load.test.js

# run with the live web dashboard (real-time graphs in the browser)
k6 run --out web-dashboard performance/tests/load.test.js
```

> [k6](https://k6.io) is a standalone binary with no Node dependency. Tests run against the shared public Restful-Booker instance, which resets periodically and intermittently rate-limits writes — occasional throttling under load is environmental, not a test defect.

---

## License

MIT