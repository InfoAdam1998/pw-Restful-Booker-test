/**
 * Load test — GET /booking
 *
 * Purpose: simulate normal expected traffic against the bookings list
 * endpoint, ramping up to 20 concurrent virtual users (see `load` in
 * config/scenarios.js), and confirm it stays fast and error-free.
 *
 * Run with: k6 run performance/tests/load.test.js
 */
import http from 'k6/http';
import { check, sleep } from 'k6';
import { load } from '../config/scenarios.js';
import { thresholds } from '../config/thresholds.js';

// `options` is read by k6 to configure the run: the `load` ramp profile
// plus the shared pass/fail thresholds.
export const options = {
    ...load,
    thresholds,
};

// Runs once per iteration, per Virtual User, for the life of the test.
export default function () {
    const res = http.get('https://restful-booker.herokuapp.com/booking');

    // Record pass/fail checks; these show up in the k6 summary and don't
    // stop the iteration on failure.
    check(res, {
        'status is 200': (r) => r.status === 200,
        'response under 800ms': (r) => r.timings.duration < 800,
    });

    // Pause 1 second between iterations so each VU behaves like a real user
    // pacing their requests, rather than hammering the API back-to-back.
    sleep(1);
}
