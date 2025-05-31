import { render, act } from '@testing-library/react';

const ORIGINAL_ENV_VERSION = process.env.VERSION;

describe('useIsStale', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    (global as any).fetch = jest.fn();
  });

  afterEach(() => {
    jest.clearAllTimers();
    process.env.VERSION = ORIGINAL_ENV_VERSION;
  });

  function TestComponent({ interval }: { interval?: number }) {
    const { useIsStale } = require('../../hooks/useVersion');
    const stale = useIsStale(interval);
    return <span>{stale ? 'stale' : 'fresh'}</span>;
  }

  it('shows fresh when versions match', async () => {
    process.env.VERSION = '1.0.0';
    (global.fetch as jest.Mock).mockResolvedValue({ json: async () => ({ version: '1.0.0' }) });
    const { findByText } = render(<TestComponent interval={1000} />);
    await act(async () => { jest.runOnlyPendingTimers(); });
    expect(await findByText('fresh')).toBeInTheDocument();
  });

  it('shows stale when versions differ', async () => {
    process.env.VERSION = '1.0.0';
    (global.fetch as jest.Mock).mockResolvedValue({ json: async () => ({ version: '2.0.0' }) });
    const { findByText } = render(<TestComponent interval={1000} />);
    await act(async () => { jest.runOnlyPendingTimers(); });
    expect(await findByText('stale')).toBeInTheDocument();
  });
});
