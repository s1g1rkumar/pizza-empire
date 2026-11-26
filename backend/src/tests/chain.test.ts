import assert from 'node:assert/strict';
import { AddressInfo } from 'node:net';
import test from 'node:test';
import app from '../app';

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

test('GET /api/v1/chain requires authentication', async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/v1/chain`);
    assert.equal(response.status, 401);
  });
});

test('POST /api/v1/chain/restaurants/:restaurantId/assign-manager requires authentication', async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/v1/chain/restaurants/1/assign-manager`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ managerEmployeeId: 2 }),
    });
    assert.equal(response.status, 401);
  });
});

test('POST /api/v1/chain/restaurants/:restaurantId/rent/pay requires authentication', async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/v1/chain/restaurants/1/rent/pay`, {
      method: 'POST',
    });
    assert.equal(response.status, 401);
  });
});
