import { test, expect } from '@playwright/test';
import { env } from '../config/env';

/**
 * POST /auth — token issuance for the Restful-Booker admin user.
 * Uses the plain @playwright/test `request` fixture directly (no
 * `bookingApi`/`token` fixtures needed, since these tests exercise
 * /auth itself rather than consuming a token).
 */
test.describe('Auth API', { tag: '@auth' }, () => {

    test('POST /auth returns a token for valid credentials', { tag: '@smoke' }, async ({ request }) => {
        const response = await request.post('/auth', {
            data: {
                username: env.ADMIN_USER,
                password: env.ADMIN_PASSWORD
            }
        })

        expect(response.status()).toBe(200);

        const body = await response.json();
        expect(body.token).toBeDefined();
        expect(typeof body.token).toBe('string');
    })

    test('POST /auth rejects invalid credentials', { tag: '@negative' }, async ({ request }) => {
        const response = await request.post('/auth', {
            data: {
                username: 'wronguser',
                password: 'wrong_password'
            }
        })

        // Restful-Booker responds 200 even on bad credentials — failure is
        // signalled via body.reason rather than the HTTP status code.
        expect(response.status()).toBe(200);

        const body = await response.json();
        expect(body.token).toBeUndefined();
        expect(body.reason).toBe('Bad credentials');
    })
})
