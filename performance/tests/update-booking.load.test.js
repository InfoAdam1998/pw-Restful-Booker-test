/**
 * Load test — PUT /booking/:id (update a booking)
 *
 * Purpose: verify the authenticated update-booking endpoint stays fast and
 * correct under concurrent load (see `load` in config/scenarios.js — ramps
 * up to 20 virtual users).
 *
 * Unlike the create/read tests, this one needs an auth token and an existing
 * booking to update. Both are prepared once via `setup()` (see below) rather
 * than being redone by every virtual user on every iteration.
 *
 * Run with: k6 run performance/tests/update-booking.load.test.js
 */
import http from 'k6/http';
import { check, sleep } from 'k6';
import { load } from '../config/scenarios.js';
import { thresholds } from '../config/thresholds.js';

// Base URL for the API under test.
const BASE_URL = 'https://restful-booker.herokuapp.com';

// `options` is read by k6 to configure the run: the `load` ramp profile
// plus the shared pass/fail thresholds.
export const options = {
    ...load,
    thresholds,
};

/**
 * setup() — a special k6 lifecycle function that runs exactly once, before
 * any Virtual User starts iterating (not once per VU, and not once per
 * iteration). It's the right place for one-time preparation that every VU
 * can then reuse, such as logging in or creating seed data.
 *
 * Whatever it `return`s is passed as the `data` argument to the default
 * function below, and is shared (read-only) across all VUs.
 */
export function setup() {
    // Log in once and reuse the resulting token for every update request,
    // instead of every VU authenticating on every iteration.
    const authRes = http.post(`${BASE_URL}/auth`,
        JSON.stringify({ username: 'admin', password: 'password123' }),
        { headers: { 'Content-Type': 'application/json' } }
    );

    const token = authRes.json('token');

    // Create one booking that the load test will repeatedly update.
    const createRes = http.post(
        `${BASE_URL}/booking`,
        JSON.stringify({
            firstname: 'Jim',
            lastname: 'Brown',
            totalprice: 111,
            depositpaid: true,
            bookingdates: { checkin: '2018-01-01', checkout: '2019-01-01' },
            additionalneeds: 'Breakfast',
        }),
        { headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json' }
        }
    );

    const bookingId = createRes.json('bookingid');

    // This object becomes the `data` parameter in the default function.
    return { token, bookingId };
}

// Runs once per iteration, per Virtual User, for the life of the test.
// `data` is exactly what `setup()` returned above.
export default function (data) {
    const updateBooking = JSON.stringify({
        firstname: 'Sarah',
        lastname: 'Smith',
        totalprice: 500,
        depositpaid: false,
        bookingdates: { checkin: '2024-01-01', checkout: '2024-01-10' },
        additionalneeds: 'Late checkout',
    })

    // The Restful-Booker API expects the auth token as a `token` cookie
    // (not a Bearer header) on write operations.
    const params = {
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            'Cookie': `token=${data.token}`,
        },
    };

    const res = http.put(`${BASE_URL}/booking/${data.bookingId}`, updateBooking, params);

    // Record pass/fail checks; these show up in the k6 summary and don't
    // stop the iteration on failure.
    check(res, {
        'status is 200': (r) => r.status === 200,
        'update reflected (firstname is Sarah)': (r) => r.json('firstname') === 'Sarah',
        'response under 800ms': (r) => r.timings.duration < 800,
    })

    // Pace each virtual user — realistic traffic, not a flood.
    sleep(1);
}