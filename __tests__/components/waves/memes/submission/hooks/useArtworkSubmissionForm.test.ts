import { renderHook, act } from '@testing-library/react';
import { useArtworkSubmissionForm } from '../../../../../../components/waves/memes/submission/hooks/useArtworkSubmissionForm';

jest.mock('../../../../../../components/waves/memes/traits/schema', () => ({ initialTraits: { title: '', description: '', artist: '', seizeArtistProfile: '' } }));
jest.mock('../../../../../../components/auth/Auth', () => ({ useAuth: jest.fn() }));

const { useAuth } = require('../../../../../../components/auth/Auth');

describe('useArtworkSubmissionForm', () => {
  beforeEach(() => {
    (useAuth as jest.Mock).mockReturnValue({ connectedProfile: { handle: 'alice' } });
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
});
