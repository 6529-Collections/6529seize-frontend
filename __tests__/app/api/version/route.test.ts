jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn(),
  },
}));

import { NextResponse } from 'next/server';
import { GET } from '../../../../app/api/version/route';

const jsonMock = NextResponse.json as jest.Mock;

describe('GET version route', () => {
  const originalEnv = process.env.VERSION;

  afterEach(() => {
    process.env.VERSION = originalEnv;
    jest.clearAllMocks();
  });

  it('returns version from env and disables cache', async () => {
    process.env.VERSION = 'test-version';
    const expected = { foo: 'bar' }; // placeholder return object
    jsonMock.mockReturnValue(expected);

    const result = await GET();
    expect(jsonMock).toHaveBeenCalledWith(
      { version: 'test-version' },
      { headers: { 'Cache-Control': 'no-store, must-revalidate' } },
    );
    expect(result).toBe(expected);
  });

  it('returns default version when env variable is undefined', async () => {
    delete process.env.VERSION;
    const expected = { foo: 'bar' };
    jsonMock.mockReturnValue(expected);

    const result = await GET();
    expect(jsonMock).toHaveBeenCalledWith(
      { version: 'unknown' },
      { headers: { 'Cache-Control': 'no-store, must-revalidate' } },
    );
    expect(result).toBe(expected);
  });
});
