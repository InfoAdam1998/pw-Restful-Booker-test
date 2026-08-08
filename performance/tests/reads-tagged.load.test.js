/**
 * Load test — GET /booking (list) and GET /booking/:id (single), with
 * per-endpoint tagging.
 *
 * Purpose: the list endpoint returns far more data than fetching a single
 * booking, so it's expected to be slower. Tagging each request lets us hold
 * them to two different thresholds instead of one shared (and therefore
 * inaccurate) gate — see `tags` and the `thresholds` object below.
 *
 * Run with: k6 run performance/tests/reads-tagged.load.test.js
 */
import http from 'k6/http';
import { check, sleep } from 'k6';
import { load } from '../config/scenarios.js';

const BASE_URL = 'https://restful-booker.herokuapp.com';

// `options` is read by k6 to configure the run. Unlike the other tests,
// thresholds are defined inline here (instead of importing the shared
// config/thresholds.js) because this test needs endpoint-specific rules.
export const options = {
    ...load,
    // Per-endpoint thresholds. Each tagged request gets its own gate, so we can
    // hold the light "single" endpoint to a tighter standard than the heavier "list".
    // The `{endpoint:list}` / `{endpoint:single}` syntax filters the
    // `http_req_duration` metric down to just the requests tagged that way below.
    thresholds: {
        http_req_failed: ['rate<0.01'],                            // overall error rate
        'http_req_duration{endpoint:list}': ['p(95)<900'],         // list returns more data → more lenient
        'http_req_duration{endpoint:single}': ['p(95)<700'],       // single is lighter → tighter gate
    },
};

// Runs once per iteration, per Virtual User: fetch the full list, then one
// individual booking from that list.
export default function () {
    // GET /booking (list) — tagged "list" so its timings are measured separately.
    const listRes = http.get(`${BASE_URL}/booking`, {
        headers: { Accept: 'application/json' },
        tags: { endpoint: 'list' },
    });

    check(listRes, {
        'list status is 200': (r) => r.status === 200,
        'list body is an array': (r) => Array.isArray(r.json()),
    });

    sleep(1);

    // Take a real id from the list, then fetch that single booking.
    // Using a real id (rather than a hardcoded one) keeps this test valid
    // even as the shared demo API's data changes or resets.
    const bookings = listRes.json();
    if (bookings && bookings.length > 0) {
        const id = bookings[0].bookingid;

        // GET /booking/:id (single) — tagged "single" so its timings are measured separately.
        const singleRes = http.get(`${BASE_URL}/booking/${id}`, {
            headers: { Accept: 'application/json' },
            tags: { endpoint: 'single' },
        });

        check(singleRes, {
            'single status is 200': (r) => r.status === 200,
            'single has firstname': (r) => r.json('firstname') !== undefined,
        });
    }

    // Pace each virtual user — realistic traffic, not a flood.
    sleep(1);
}