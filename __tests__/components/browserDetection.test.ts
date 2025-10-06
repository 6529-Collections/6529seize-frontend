import { detectBrowser, isBrowserSupported } from '@/components/waves/memes/file-upload/utils/browserDetection';

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

  it('detects safari browser', () => {
    Object.defineProperty(window, 'navigator', { value: { userAgent: 'Safari' }, writable: true });
    expect(detectBrowser()).toBe('Safari');
  });

  it('returns drag and drop warning when unsupported', () => {
    const origCreate = document.createElement;
    Object.defineProperty(window, 'File', { value: function(){} });
    Object.defineProperty(window, 'FileReader', { value: function(){} });
    Object.defineProperty(window, 'FileList', { value: function(){} });
    Object.defineProperty(window, 'Blob', { value: function(){} });
    Object.defineProperty(window, 'URL', { value: { createObjectURL: () => {} } });
    (document as any).createElement = () => ({}) as any;
    const result = isBrowserSupported();
    (document as any).createElement = origCreate;
    expect(result.reason).toMatch('drag and drop');
  });
});
