import { test, expect } from '@playwright/test';


test('POST /auth returns a token for valid credentials', async ({ request }) => {
    const response = await request.post('/auth', {
        data: {
            username: process.env.ADMIN_USER,
            password: process.env.ADMIN_PASSWORD
        }
    })

    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.token).toBeDefined();
    expect(typeof body.token).toBe('string');
})

test('POST /auth rejects invalid credentials', async ({ request }) => {
    const response = await request.post('/auth', {
        data: {
            username: 'wronguser',
            password: 'wrong_password'
        }
    })

    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.token).toBeUndefined();
    expect(body.reason).toBe('Bad credentials');
})