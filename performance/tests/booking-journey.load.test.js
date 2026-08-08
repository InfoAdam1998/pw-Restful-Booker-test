/**
 * Load test — full booking journey (CREATE -> READ -> UPDATE -> DELETE)
 *
 * Purpose: unlike the other tests, which each hit a single endpoint, this
 * one simulates a realistic end-to-end user journey: every virtual user
 * creates a booking, reads it back, updates it, then deletes it, pausing
 * between each step. This exercises the full CRUD lifecycle together and
 * under the same `load` ramp profile (see config/scenarios.js).
 *
 * `group()` (from k6) labels each step so the k6 summary breaks down
 * checks and timings per step (create/read/update/delete) instead of
 * lumping the whole iteration into one bucket.
 *
 * Run with: k6 run performance/tests/booking-journey.load.test.js
 */
import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { load } from '../config/scenarios.js';
import { thresholds } from '../config/thresholds.js';

const BASE_URL = 'https://restful-booker.herokuapp.com';

// `options` is read by k6 to configure the run: the `load` ramp profile
// plus the shared pass/fail thresholds.
export const options = {
    ...load,
    thresholds,
};

/**
 * setup() runs exactly once, before any Virtual User starts iterating.
 * We log in a single time here so every VU can reuse the same token for
 * its update/delete steps, instead of re-authenticating every iteration.
 * Whatever this returns becomes the `data` argument of the default function.
 */
export function setup() {
    const credentials = JSON.stringify({
        username: 'admin',
        password: 'password123',
    });

    const authParams = {
        headers: { 'Content-Type': 'application/json' },
    };

    const authResponse = http.post(`${BASE_URL}/auth`, credentials, authParams);
    const token = authResponse.json('token');

    const data = {
        token: token,
    };

    return data;
}

// Runs once per iteration, per Virtual User: a full
// create -> read -> update -> delete journey against one booking.
// `data` is exactly what `setup()` returned above.
export default function (data) {
    const token = data.token;
    // Declared outside the groups below so each step can read/write it —
    // the id is only known after CREATE responds, but READ/UPDATE/DELETE
    // all need it afterwards.
    let bookingId;

    // STEP 1 — CREATE: POST a new booking and capture its id for later steps.
    group('create booking', function () {
        const newBooking = JSON.stringify({
            firstname: 'Jim',
            lastname: 'Brown',
            totalprice: 111,
            depositpaid: true,
            bookingdates: { checkin: '2018-01-01', checkout: '2019-01-01' },
            additionalneeds: 'Breakfast',
        });

        const params = {
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        };

        const res = http.post(`${BASE_URL}/booking`, newBooking, params);

        check(res, {
            'create status is 200': (r) => r.status === 200,
            'create returns bookingid': (r) => r.json('bookingid') !== undefined,
        });

        bookingId = res.json('bookingid');
    });

    sleep(1);

    // STEP 2 — READ: GET the booking just created, no auth required.
    group('read booking', function () {
        const params = {
            headers: { Accept: 'application/json' },
        };

        const res = http.get(`${BASE_URL}/booking/${bookingId}`, params);

        check(res, {
            'read status is 200': (r) => r.status === 200,
            'read has firstname': (r) => r.json('firstname') !== undefined,
        });
    });

    sleep(1);

    // STEP 3 — UPDATE: PUT new details over the booking. Write operations
    // require the auth token, sent as a `Cookie` header (this API's convention).
    group('update booking', function () {
        const updatedBooking = JSON.stringify({
            firstname: 'Sarah',
            lastname: 'Smith',
            totalprice: 500,
            depositpaid: false,
            bookingdates: { checkin: '2024-01-01', checkout: '2024-01-10' },
            additionalneeds: 'Late checkout',
        });

        const params = {
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                Cookie: `token=${token}`,
            },
        };

        const res = http.put(`${BASE_URL}/booking/${bookingId}`, updatedBooking, params);

        check(res, {
            'update status is 200': (r) => r.status === 200,
            'update reflected': (r) => r.json('firstname') === 'Sarah',
        });
    });

    sleep(1);

    // STEP 4 — DELETE: remove the booking, cleaning up after this iteration.
    // `http.del` takes (url, body, params) — body is `null` since DELETE
    // sends no payload here. Restful-Booker returns 201 (not 200/204) on a
    // successful delete — that's this API's own quirk, not a k6 convention.
    group('delete booking', function () {
        const params = {
            headers: {
                Cookie: `token=${token}`,
            },
        };

        const res = http.del(`${BASE_URL}/booking/${bookingId}`, null, params);

        check(res, {
            'delete status is 201': (r) => r.status === 201,
        });
    });

    // Pace each virtual user — realistic traffic, not a flood.
    sleep(1);
}