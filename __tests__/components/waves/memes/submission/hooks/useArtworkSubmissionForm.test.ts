import { renderHook, act, waitFor } from '@testing-library/react';
import { useArtworkSubmissionForm } from '@/components/waves/memes/submission/hooks/useArtworkSubmissionForm';

const CID_V1 = 'bafybeigdyrztobg3tv6zj5n6xvztf4k5p3xf7r6xkqfq5jz3o5quftdjum';

jest.mock('@/components/waves/memes/traits/schema', () => ({
  getInitialTraitsValues: () => ({
    title: '',
    description: '',
    artist: '',
    seizeArtistProfile: '',
  }),
}));
jest.mock('@/components/auth/Auth', () => ({ useAuth: jest.fn() }));
jest.mock('@/components/waves/memes/submission/actions/validateInteractivePreview', () => ({
  validateInteractivePreview: jest.fn(),
}));

const { useAuth } = require('@/components/auth/Auth');
const { validateInteractivePreview } = require('@/components/waves/memes/submission/actions/validateInteractivePreview');

describe('useArtworkSubmissionForm', () => {
  beforeEach(() => {
    (useAuth as jest.Mock).mockReturnValue({ connectedProfile: { handle: 'alice' } });
    (validateInteractivePreview as jest.Mock).mockResolvedValue({ ok: true, contentType: 'text/html' });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('initializes traits from profile and updates fields', () => {
    const { result } = renderHook(() => useArtworkSubmissionForm());
    expect(result.current.currentStep).toBe('agreement');
    expect(result.current.traits.artist).toBe('alice');
    act(() => { result.current.setTraits({ title: 't' }); });
    expect(result.current.traits.title).toBe('t');
    act(() => { result.current.updateTraitField('description', 'd'); });
    expect(result.current.traits.description).toBe('d');
  });

  it('handles continue and file select', () => {
    const { result } = renderHook(() => useArtworkSubmissionForm());
    act(() => { result.current.handleContinueFromTerms(); });
    expect(result.current.currentStep).toBe('artwork');
    class MockFileReader { onloadend: any; readAsDataURL() { this.onloadend(); } result = 'url'; }
    global.FileReader = MockFileReader as any;
    act(() => { result.current.handleFileSelect(new File(['x'], 'a.png')); });
    expect(result.current.artworkUploaded).toBe(true);
    expect(result.current.artworkUrl).toBe('url');
  });

  it('rejects external previews that are not HTML files', () => {
    const { result } = renderHook(() => useArtworkSubmissionForm());

    act(() => { result.current.setMediaSource('url'); });
    act(() => { result.current.setExternalMediaHash('bafyBad/binary.exe'); });

    expect(result.current.isExternalMediaValid).toBe(false);
    expect(result.current.externalMediaError).toBe('IPFS embeds must reference the root CID without subpaths.');
    expect(result.current.externalMediaPreviewUrl).toBe('');
    expect(result.current.externalMediaValidationStatus).toBe('invalid');
    expect(validateInteractivePreview).not.toHaveBeenCalled();
  });

  it('accepts external previews that resolve to HTML documents', async () => {
    const { result } = renderHook(() => useArtworkSubmissionForm());

    act(() => { result.current.setMediaSource('url'); });
    act(() => { result.current.setExternalMediaHash(CID_V1); });

    await waitFor(() => {
      expect(result.current.isExternalMediaValid).toBe(true);
    });

    expect(validateInteractivePreview).toHaveBeenCalledWith({
      provider: 'ipfs',
      path: CID_V1,
    });
    expect(result.current.externalMediaError).toBeNull();
    expect(result.current.externalMediaPreviewUrl).toBe(`https://ipfs.io/ipfs/${CID_V1}`);
    expect(result.current.externalMediaValidationStatus).toBe('valid');
  });

  it('surfaces gateway validation errors from server action', async () => {
    (validateInteractivePreview as jest.Mock).mockResolvedValue({
      ok: false,
      reason: 'Gateway returned 404.',
    });

    const { result } = renderHook(() => useArtworkSubmissionForm());

    act(() => { result.current.setMediaSource('url'); });
    act(() => { result.current.setExternalMediaHash(CID_V1); });

    await waitFor(() => {
      expect(result.current.externalMediaError).toBe('Gateway returned 404.');
    });

    expect(result.current.isExternalMediaValid).toBe(false);
    expect(result.current.externalMediaPreviewUrl).toBe('');
    expect(result.current.externalMediaValidationStatus).toBe('invalid');
  });

  it('restores uploaded artwork URL when switching back from external media', async () => {
    const { result } = renderHook(() => useArtworkSubmissionForm());
    class MockFileReader {
      onloadend: (() => void) | null = null;
      result = 'data-upload';
      readAsDataURL() {
        this.onloadend?.();
      }
    }
    global.FileReader = MockFileReader as any;

    act(() => {
      result.current.handleFileSelect(new File(['x'], 'a.png'));
    });

    expect(result.current.mediaSource).toBe('upload');
    expect(result.current.artworkUrl).toBe('data-upload');

    act(() => {
      result.current.setMediaSource('url');
    });
    act(() => {
      result.current.setExternalMediaHash(CID_V1);
    });

    await waitFor(() => {
      expect(result.current.isExternalMediaValid).toBe(true);
    });
    expect(result.current.artworkUrl).toContain('ipfs://');

    act(() => {
      result.current.setMediaSource('upload');
    });

    expect(result.current.artworkUrl).toBe('data-upload');
    expect(result.current.artworkUploaded).toBe(true);
  });
});
