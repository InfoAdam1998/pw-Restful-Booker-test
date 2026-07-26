import { test, expect } from '../fixtures/test-options';   // <- our file, NOT @playwright/test
import { makeBooking } from '../utils/testData';


test('GET /ping returns healthy status', async ({ request }) => {
    const response = await request.get('/ping');
    expect(response.status()).toBe(201);
})

test('GET /booking returns a list of bookings', async ({ request }) => {
    const response = await request.get('/booking');
    expect(response.status()).toBe(200);

    const body = await response.json()
    expect(Array.isArray(body)).toBeTruthy();
})

test('GET /booking/:id returns the booking you created', async ({ bookingApi }) => {
    const createResponse = await bookingApi.createBooking(makeBooking());

    const result = await createResponse.json();
    expect(result.bookingid).toBeDefined();
    const bookingid  = result.bookingid ;

    const response = await bookingApi.getBooking(bookingid);
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.firstname).toBe('Jim')
    expect(body.lastname).toBe('Brown')
})

test('GET /booking filtered by name returns matching bookings', async ({ request }) => {
    const response = await request.get('/booking', {
        params: {
            firstname: 'Jim',
            lastname: 'Brown'
        }
    })
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(Array.isArray(body)).toBeTruthy();
})