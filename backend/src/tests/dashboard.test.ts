import assert from 'node:assert/strict';
import { AddressInfo } from 'node:net';
import test from 'node:test';
import app from '../app';

test('Dashboard API endpoints require JWT authentication', async () => {
  const server = app.listen(0);
  const port = (server.address() as AddressInfo).port;
  const baseUrl = `http://127.0.0.1:${port}/api/v1`;

  try {
    const dashRes = await fetch(`${baseUrl}/dashboard`);
    assert.equal(dashRes.status, 401);

    const notifRes = await fetch(`${baseUrl}/dashboard/notifications/read-all`, {
      method: 'POST',
    });
    assert.equal(notifRes.status, 401);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});
