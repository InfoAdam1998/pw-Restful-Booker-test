import { test, expect } from '../fixtures/test-options';   // <- our file, NOT @playwright/test
import { makeBooking } from '../utils/testData';

/**
 * PUT / PATCH / DELETE /booking/:id — endpoints that mutate a booking and
 * require a valid auth token (see the `token` fixture in
 * fixtures/test-options.ts). Each test creates its own booking first so it
 * doesn't depend on data left behind by other tests.
 */
test.describe('Booking API - update & delete', { tag: ['@booking', '@update', '@delete'] }, () => {

    test('PUT /booking/:id updates a booking with a valid token', { tag: '@smoke' }, async ({ bookingApi, token }) => {
        // Create a booking to update (own your data)
        const createResponse = await bookingApi.createBooking(makeBooking());

        const createBody = await createResponse.json();
        const bookingid = createBody.bookingid;

        // Update it — full replacement, WITH the token in the Cookie header
        const updateBooking = {
            firstname: 'James',
            lastname: 'Smith',
            totalprice: 500,
            depositpaid: false,
            bookingdates: { checkin: '2025-01-01', checkout: '2025-01-10' },
            additionalneeds: 'Late checkout',
        }

        const response = await bookingApi.updateBooking(bookingid, updateBooking, token)

        expect(response.status()).toBe(200);
        const body = await response.json();
        expect(body).toEqual(updateBooking);

    })

    test('PATCH /booking/:id partially updates a booking', async ({ bookingApi, token }) => {

        // Create a booking (Jim Brown, price 111)
        const createResponse = await bookingApi.createBooking(makeBooking());

        const createBody = await createResponse.json();
        const bookingid = createBody.bookingid;
        const partialData = { firstname: 'Jane', totalprice: 999 }

        // PATCH only firstname + totalprice — the rest of the booking must be untouched
        const patchBooking = await bookingApi.patchBooking(bookingid, partialData, token);
        expect(patchBooking.status()).toBe(200);

        const body = await patchBooking.json();
        expect(body.firstname).toBe('Jane');
        expect(body.lastname).toBe('Brown');
        expect(body.totalprice).toBe(999);
    })

    test('DELETE /booking/:id removes a booking', { tag: '@smoke' }, async ({ bookingApi, token }) => {

        // Create a booking to delete
        const createResponse = await bookingApi.createBooking(makeBooking());

        const createBody = await createResponse.json();
        const bookingid = createBody.bookingid;

        const deleteResponse = await bookingApi.deleteBooking(bookingid, token);
        expect(deleteResponse.status()).toBe(201);

        // Confirm the booking is actually gone, not just a 201 with no effect
        const getResponse = await bookingApi.getBooking(bookingid);
        expect(getResponse.status()).toBe(404);
    })
})
