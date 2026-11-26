import assert from 'node:assert/strict';
import { AddressInfo } from 'node:net';
import test from 'node:test';
import app from '../app';
import { hashToken, signAccessToken, verifyAccessToken } from '../utils/jwt';

test('JWT signAccessToken and verifyAccessToken round-trip', () => {
  const token = signAccessToken({ userId: 42, playerId: 101, role: 'PLAYER' });
  const decoded = verifyAccessToken(token);
  assert.equal(decoded.userId, 42);
  assert.equal(decoded.playerId, 101);
  assert.equal(decoded.role, 'PLAYER');
});

test('hashToken produces deterministic SHA-256 hex digest', () => {
  const a = hashToken('sample-refresh-token');
  const b = hashToken('sample-refresh-token');
  assert.equal(a, b);
  assert.equal(a.length, 64);
});

test('Auth API endpoints enforce Joi validation and JWT protection', async () => {
  const server = app.listen(0);
  const port = (server.address() as AddressInfo).port;
  const baseUrl = `http://127.0.0.1:${port}/api/v1`;

  try {
    // 1. Register validation failure
    const badRegister = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'not-an-email', username: 'a', password: '123' }),
    });
    assert.equal(badRegister.status, 400);
    const badRegisterJson = (await badRegister.json()) as {
      success: boolean;
      error: { code: string };
    };
    assert.equal(badRegisterJson.success, false);
    assert.equal(badRegisterJson.error.code, 'VALIDATION_ERROR');

    // 2. Login validation failure
    const badLogin = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'invalid' }),
    });
    assert.equal(badLogin.status, 400);

    // 3. Protected route /auth/profile rejects missing token
    const unauthProfile = await fetch(`${baseUrl}/auth/profile`);
    assert.equal(unauthProfile.status, 401);

    // 4. Protected route /auth/change-password rejects missing token
    const unauthChangePwd = await fetch(`${baseUrl}/auth/change-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword: 'old', newPassword: 'newpassword123' }),
    });
    assert.equal(unauthChangePwd.status, 401);

    // 5. Refresh endpoint rejects missing cookie
    const unauthRefresh = await fetch(`${baseUrl}/auth/refresh`, { method: 'POST' });
    assert.equal(unauthRefresh.status, 401);

    // 6. Logout succeeds cleanly even without cookie
    const logoutRes = await fetch(`${baseUrl}/auth/logout`, { method: 'POST' });
    assert.equal(logoutRes.status, 200);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});
