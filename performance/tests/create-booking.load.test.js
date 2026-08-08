/**
 * Load test — POST /booking (create a booking)
 *
 * Purpose: verify the create-booking endpoint stays fast and correct while
 * under concurrent load (see `load` in config/scenarios.js — ramps up to
 * 20 virtual users).
 *
 * Run with: k6 run performance/tests/create-booking.load.test.js
 */
import http from 'k6/http';
import { check, sleep } from 'k6';
import { load } from '../config/scenarios.js';
import { thresholds } from '../config/thresholds.js';

// Base URL for the API under test. Hardcoded here since this suite targets
// a single fixed public demo instance; extract to an env var if that changes.
const BASE_URL = 'https://restful-booker.herokuapp.com';

// `options` is read by k6 to configure the run: the `load` ramp profile
// plus the shared pass/fail thresholds.
export const options = {
    ...load,
    thresholds,
};

// Runs once per iteration, per Virtual User, for the life of the test.
export default function () {
    // Booking body — must be a JSON string in k6 (unlike Playwright, which
    // auto-serializes an object passed to `data`).
    const payload = JSON.stringify({
        firstname: 'Jim',
        lastname: 'Brown',
        totalprice: 111,
        depositpaid: true,
        bookingdates: { checkin: '2018-01-01', checkout: '2019-01-01' },
        additionalneeds: 'Breakfast',
    });

    // Content-Type tells the server the body is JSON; Accept asks for a JSON response.
    const params = {
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
        },
    };

    // POST /booking — url, body, options (k6's three-argument form).
    const res = http.post(`${BASE_URL}/booking`, payload, params);

    // Record pass/fail checks; these show up in the k6 summary and don't
    // stop the iteration on failure.
    check(res, {
        'status is 200': (r) => r.status === 200,
        'response has a bookingid': (r) => r.json('bookingid') !== undefined,
        'response under 800ms': (r) => r.timings.duration < 800,
    });

    // Pace each virtual user — realistic traffic, not a flood.
    sleep(1);
}
