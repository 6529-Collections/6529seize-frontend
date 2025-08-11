import handler from '@/pages/api/mints';
import { NextApiRequest, NextApiResponse } from 'next';

describe('mints ICS feed', () => {
  it('returns recurring rule', () => {
    const req = {} as NextApiRequest;
    const res = {
      setHeader: jest.fn(),
      send: jest.fn(),
    } as unknown as NextApiResponse;
    handler(req, res);
    expect(res.setHeader).toHaveBeenCalledWith(
      'Content-Type',
      'text/calendar; charset=utf-8',
    );
    expect(res.send).toHaveBeenCalled();
    const out = (res.send as jest.Mock).mock.calls[0][0];
    expect(out).toContain('RRULE');
  });
});
