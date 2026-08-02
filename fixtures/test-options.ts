import { test as base, expect } from '@playwright/test';
import { BookingApi } from '../api/BookingApi';
import { env } from '../config/env';


/**
 * Custom fixtures layered on top of Playwright's built-in `request` fixture.
 * Import `test`/`expect` from this file (instead of `@playwright/test`) in
 * any spec that needs `bookingApi` and/or `token`.
 */
type Fixtures = {
    /** Pre-constructed `BookingApi` client, wired to the project's `request` context. */
    bookingApi: BookingApi;
    /** Valid auth token for the admin user, fetched once per test that requests it. */
    token: string;
}

export const test = base.extend<Fixtures>({
    // provides a ready-constructed BookingApi to any test that asks
    bookingApi: async ({ request }, use) => {
        await use(new BookingApi(request));
    },

    // provides a valid auth token to any test that asks
    // requires ADMIN_USER / ADMIN_PASSWORD to be set (see .env)
    token: async ({ bookingApi}, use) => {
        const token = await bookingApi.getToken(
            env.ADMIN_USER!,
            env.ADMIN_PASSWORD!,
        );
        await use(token);
    }
})

export { expect }
