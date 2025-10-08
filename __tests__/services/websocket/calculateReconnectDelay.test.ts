import { calculateReconnectDelay } from '@/services/websocket/WebSocketProvider';

describe('calculateReconnectDelay', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns exponential backoff without jitter when jitterFactor is zero', () => {
    const delay = calculateReconnectDelay(2, 1000, 30000, 0);
    expect(delay).toBe(2250);
  });

  it('applies positive jitter up to the configured factor', () => {
    jest.spyOn(Math, 'random').mockReturnValue(1);
    const delay = calculateReconnectDelay(0, 1000, 30000, 0.2);
    expect(delay).toBe(1200);
  });

  it('applies negative jitter down to the configured factor', () => {
    jest.spyOn(Math, 'random').mockReturnValue(0);
    const delay = calculateReconnectDelay(0, 1000, 30000, 0.2);
    expect(delay).toBe(800);
  });

  it('never exceeds maxDelay even with jitter', () => {
    jest.spyOn(Math, 'random').mockReturnValue(1);
    const delay = calculateReconnectDelay(10, 1000, 1500, 0.5);
    expect(delay).toBeLessThanOrEqual(1500);
  });

  it('ignores jitter factors below zero', () => {
    jest.spyOn(Math, 'random').mockReturnValue(1);
    const delay = calculateReconnectDelay(1, 1000, 30000, -0.5);
    expect(delay).toBe(1500);
  });
});
