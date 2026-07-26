import { test, expect } from '../fixtures/test-options';   // <- our file, NOT @playwright/test
import { makeBooking } from '../utils/testData';


test('POST /booking creates a booking and returns it in full', async ({ bookingApi }) => {
    const newBooking = makeBooking()

    const response = await bookingApi.createBooking(newBooking);
    expect(response.status()).toBe(200);

    const body  = await response.json();
    expect(body.bookingid).toBeDefined();
    expect(body.booking).toEqual(newBooking);

})

test('POST /booking stores different data correctly', async ({ bookingApi }) => {
    const newBooking = makeBooking({firstname: 'Sarah',
        lastname: 'Smith',
        totalprice: 500,
        depositpaid: false,
        bookingdates: { checkin: '2025-06-01', checkout: '2025-06-10' },
        additionalneeds: 'Late checkout',
    })

    const response = await bookingApi.createBooking(newBooking);

    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.bookingid).toBeDefined();
    expect(body.booking).toEqual(newBooking);
})