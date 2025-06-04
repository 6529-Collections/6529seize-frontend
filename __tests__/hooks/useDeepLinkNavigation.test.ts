import { renderHook, act } from '@testing-library/react';
import { useDeepLinkNavigation } from '../../hooks/useDeepLinkNavigation';
import { useRouter } from 'next/router';
import { App } from '@capacitor/app';

jest.mock('next/router', () => ({ useRouter: jest.fn() }));
jest.mock('@capacitor/app', () => ({ App: { addListener: jest.fn() } }));
const useCapacitorMock = jest.fn(() => ({ isCapacitor: true }));
jest.mock('../../hooks/useCapacitor', () => () => useCapacitorMock());

const push = jest.fn();
(useRouter as jest.Mock).mockReturnValue({ push });
const remove = jest.fn();
let callback: any;
(App.addListener as jest.Mock).mockImplementation((_e: any, cb: any) => {
  callback = cb;
  return Promise.resolve({ remove });
});

beforeEach(() => {
  jest.clearAllMocks();
  useCapacitorMock.mockImplementation(() => ({ isCapacitor: true }));
  (App.addListener as jest.Mock).mockImplementation((_e: any, cb: any) => {
    callback = cb;
    return Promise.resolve({ remove });
  });
});

test('navigates on deep link and cleans up', async () => {
  const { unmount } = renderHook(() => useDeepLinkNavigation());
  await act(async () => {
    callback({ url: 'seize://navigate/waves/1?foo=bar' });
  });
  expect(push).toHaveBeenCalledWith({ pathname: '/waves/1', query: expect.objectContaining({ foo: 'bar' }) });
  unmount();
  await Promise.resolve();
  expect(remove).toHaveBeenCalled();
});

test('does not register when not capacitor', () => {
  useCapacitorMock.mockImplementation(() => ({ isCapacitor: false }));
  renderHook(() => useDeepLinkNavigation());
  expect(App.addListener).not.toHaveBeenCalled();
});
