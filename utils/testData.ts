type Booking = {
    firstname: string;
    lastname: string;
    totalprice: number;
    depositpaid: boolean;
    bookingdates: { checkin: string; checkout: string };
    additionalneeds: string;
}

/**
 * Test data builder for a Restful-Booker booking payload.
 *
 * Returns a valid default booking (Jim Brown), letting callers override
 * only the fields they care about instead of restating the whole object.
 *
 * @example
 * makeBooking() // default Jim Brown booking
 * makeBooking({ firstname: 'Sarah', totalprice: 500 }) // default booking with two fields overridden
 */
export function makeBooking(overrides: Partial<Booking> = {}): Booking {
    return {
        firstname: 'Jim',
        lastname: 'Brown',
        totalprice: 111,
        depositpaid: true,
        bookingdates: { checkin: '2018-01-01', checkout: '2019-01-01' },
        additionalneeds: 'Breakfast',
        ...overrides,
    }
}
