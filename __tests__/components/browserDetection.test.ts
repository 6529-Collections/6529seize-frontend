import { detectBrowser, isBrowserSupported } from '../../components/waves/memes/file-upload/utils/browserDetection';

describe('browser detection utilities', () => {
  afterEach(() => {
    Object.defineProperty(window, 'navigator', { value: { userAgent: '' }, writable: true });
  });

  it('detects chrome browser', () => {
    Object.defineProperty(window, 'navigator', { value: { userAgent: 'Chrome' }, writable: true });
    expect(detectBrowser()).toBe('Chrome');
  });

  it('detects unsupported File API', () => {
    const original = { ...window } as any;
    Object.defineProperty(window, 'File', { value: undefined });
    const result = isBrowserSupported();
    Object.assign(window, original);
    expect(result.supported).toBe(false);
  });
});
