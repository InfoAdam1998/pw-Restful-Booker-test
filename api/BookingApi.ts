import { APIRequestContext, APIResponse } from '@playwright/test';

/**
 * Thin client wrapping the Restful-Booker (https://restful-booker.herokuapp.com)
 * REST endpoints used by this test suite.
 *
 * Every method returns the raw Playwright `APIResponse` (not the parsed body),
 * so tests stay in control of asserting status codes and shaping the JSON.
 *
 * Endpoints that mutate a booking (PUT/PATCH/DELETE) require a valid auth
 * token — see `getToken()` and the `token` fixture in `fixtures/test-options.ts`.
 */
export class BookingApi {
    private readonly request: APIRequestContext;

    constructor(request: APIRequestContext) {
        this.request = request;
    }

    /**
     * POST /auth — exchanges admin credentials for an auth token.
     * @param username Restful-Booker admin username (see `ADMIN_USER` env var)
     * @param password Restful-Booker admin password (see `ADMIN_PASSWORD` env var)
     * @returns the token string, or `undefined` if the credentials were rejected
     */
    async getToken(username: string, password: string): Promise<string | undefined> {
        const response = await this.request.post('/auth', {
            data: {
                username,
                password
            }
        })

        const body = await response.json();
        return body.token;
    }

    /**
     * POST /booking — creates a new booking. Does not require authentication.
     * @param bookingData booking payload, e.g. built via `makeBooking()`
     */
    async createBooking(bookingData: object): Promise<APIResponse> {
        return await this.request.post('/booking', {
            data: bookingData
        })
    }

    /**
     * GET /booking/:id — fetches a single booking by id. Does not require authentication.
     * @param bookingId id returned by `createBooking()`
     */
    async getBooking(bookingId: number): Promise<APIResponse> {
        return await this.request.get(`/booking/${bookingId}`);
    }

    /**
     * PUT /booking/:id — full replacement of an existing booking. Requires a valid token.
     * @param bookingId id of the booking to replace
     * @param bookingData complete booking payload (all fields required)
     * @param token auth token from `getToken()` / the `token` fixture
     */
    async updateBooking(bookingId: number, bookingData: object, token: string): Promise<APIResponse> {
        return await this.request.put(`/booking/${bookingId}`, {
            headers: {
                Cookie: `token=${token}`
            },
            data: bookingData
        })
    }

    /**
     * PATCH /booking/:id — partial update of an existing booking. Requires a valid token.
     * @param bookingId id of the booking to update
     * @param bookingData subset of booking fields to change
     * @param token auth token from `getToken()` / the `token` fixture
     */
    async patchBooking(bookingId: number, bookingData: object, token: string): Promise<APIResponse> {
        return await this.request.patch(`/booking/${bookingId}`, {
            headers: {
                Cookie: `token=${token}`
            },
            data: bookingData
        })
    }

    /**
     * DELETE /booking/:id — removes an existing booking. Requires a valid token.
     * @param bookingId id of the booking to delete
     * @param token auth token from `getToken()` / the `token` fixture
     */
    async deleteBooking(bookingId: number, token: string): Promise<APIResponse> {
        return this.request.delete(`/booking/${bookingId}`, {
            headers: {
                Cookie: `token=${token}`
            }
        })
    }
}
