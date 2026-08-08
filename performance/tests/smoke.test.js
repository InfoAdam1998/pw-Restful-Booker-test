/**
 * Smoke test — GET /booking
 *
 * Purpose: a quick sanity check that the endpoint is reachable and returns
 * the expected shape, using minimal load (see `smoke` in config/scenarios.js:
 * 1 virtual user, 30 seconds). Run this before heavier load/stress tests.
 *
 * Run with: k6 run performance/tests/smoke.test.js
 */
import http from 'k6/http';
import { check } from 'k6';
import { smoke } from '../config/scenarios.js';
import { thresholds } from '../config/thresholds.js';

// `options` is a k6-reserved export name — k6 reads it to configure the run.
// Spreading `smoke` supplies the VU/duration profile; `thresholds` supplies
// the shared pass/fail quality gates.
export const options = {
    ...smoke,
    thresholds,
};

// The default export is the function each Virtual User runs, once per iteration,
// for the duration of the test.
export default function () {
    // Send a GET request to the bookings list endpoint.
    const res = http.get('https://restful-booker.herokuapp.com/booking');

    // `check()` records pass/fail results for assertions without stopping the
    // test on failure (unlike a normal `expect`/`assert`) — it just contributes
    // to the check pass-rate shown in the k6 summary.
    check(res, {
        'status is 200': (r) => r.status === 200,
        'body is a JSON array': (r) => Array.isArray(r.json()),
    });
}
