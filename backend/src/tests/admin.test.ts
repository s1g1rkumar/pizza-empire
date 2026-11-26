import assert from 'node:assert/strict';
import { AddressInfo } from 'node:net';
import test from 'node:test';
import app from '../app';
import { signAccessToken } from '../utils/jwt';

async function withServer(run: (baseUrl: string) => Promise<void>): Promise<void> {
  const server = app.listen(0);
  const address = server.address() as AddressInfo;
  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    await run(baseUrl);
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((err) => {
        if (err) {
          reject(err);
          return;
        }
        resolve();
      });
    });
  }
}

test('Admin endpoints require JWT authentication and enforce role-based authorization', async () => {
  await withServer(async (baseUrl) => {
    const unauthRes = await fetch(`${baseUrl}/api/v1/admin/analytics`);
    assert.equal(unauthRes.status, 401);

    const badLoginRes = await fetch(`${baseUrl}/api/v1/admin/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'not-an-email', password: '123' }),
    });
    assert.equal(badLoginRes.status, 400);

    const playerToken = signAccessToken({ userId: 99, playerId: 99, role: 'PLAYER' });
    const playerAnalyticsRes = await fetch(`${baseUrl}/api/v1/admin/analytics`, {
      headers: { Authorization: `Bearer ${playerToken}` },
    });
    assert.equal(playerAnalyticsRes.status, 403);

    const modToken = signAccessToken({ userId: 50, playerId: 50, role: 'MODERATOR' });
    const modConfigRes = await fetch(`${baseUrl}/api/v1/admin/config/settings/economy.tax_rate`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${modToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ settingValue: '0.10' }),
    });
    assert.equal(modConfigRes.status, 403);

    const modAnnouncementRes = await fetch(`${baseUrl}/api/v1/admin/announcements`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${modToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: 'Test Event',
        message: 'Double XP weekend!',
        severity: 'EVENT',
      }),
    });
    assert.equal(modAnnouncementRes.status, 403);
  });
});
