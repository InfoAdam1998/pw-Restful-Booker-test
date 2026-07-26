import { test as base, expect } from '@playwright/test';
import { BookingApi } from '../api/BookingApi';


type Fixtures = {
    bookingApi: BookingApi;
    token: string;
}

export const test = base.extend<Fixtures>({
    // provides a ready-constructed BookingApi to any test that asks
    bookingApi: async ({ request }, use) => {
        await use(new BookingApi(request));
    },

    // provides a valid auth token to any test that asks
    token: async ({ bookingApi}, use) => {
        const token = await bookingApi.getToken(
            process.env.ADMIN_USER!,
            process.env.ADMIN_PASSWORD!,
        );
        await use(token);
    }
})

export { expect }