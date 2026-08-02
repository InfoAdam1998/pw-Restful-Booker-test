import { test, expect } from '../fixtures/test-options';   // <- our file, NOT @playwright/test
import { makeBooking } from '../utils/testData';

/**
 * Negative / edge-case coverage: missing auth, non-existent resources, and
 * invalid payloads. These intentionally exercise error paths rather than
 * the happy path covered elsewhere in tests/.
 */
test.describe('Booking API - negative cases', { tag: '@negative' }, () => {

    test('PUT without a token is rejected', async ({ request, bookingApi }) => {
        // create a booking (no auth needed to create)
        const createResponse = await bookingApi.createBooking(makeBooking());

        const createBody = await createResponse.json();
        const bookingid = createBody.bookingid;

        const response = await request.put(`/booking/${bookingid}`, {
            data: makeBooking()
        })
        expect(response.status()).toBe(403);

    })

    test('GET a non-existent booking returns 404', async ({ bookingApi }) => {
        const response = await bookingApi.getBooking(9999999);
        expect(response.status()).toBe(404);
    });

    test('POST with a missing required field is rejected', async ({ bookingApi }) => {
        // KNOWN BUG: API returns 500 (server crash) instead of 400 (bad request)
        // when a required field is missing — it does not validate input gracefully.
        // test.fail() marks this test as an expected failure so the suite stays
        // green until the upstream API fixes the validation.
        const missingData = {
            lastname: 'Brown',
            totalprice: 111,
            depositpaid: true,
            bookingdates: { checkin: '2018-01-01', checkout: '2019-01-01' },
            additionalneeds: 'Breakfast',
        }

        test.fail();

        const response = await bookingApi.createBooking(missingData);
        expect(response.status()).toBe(400);
    })
})
