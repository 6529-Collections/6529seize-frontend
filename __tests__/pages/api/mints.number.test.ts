import handler from '@/pages/api/mints/[number]';
import { NextApiRequest, NextApiResponse } from 'next';

describe('single mint ICS', () => {
  it('returns event for mint number', () => {
    const req = { query: { number: '439' } } as unknown as NextApiRequest;
    const res = {
      setHeader: jest.fn(),
      send: jest.fn(),
      status: jest.fn().mockReturnThis(),
    } as unknown as NextApiResponse;
    handler(req, res);
    expect(res.setHeader).toHaveBeenCalledWith(
      'Content-Type',
      'text/calendar; charset=utf-8',
    );
    const out = (res.send as jest.Mock).mock.calls[0][0];
    expect(out).toContain('Mint #439');
  });
});
