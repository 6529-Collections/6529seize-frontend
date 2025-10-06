import { render, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import MemesArtSubmissionContainer from '@/components/waves/memes/submission/MemesArtSubmissionContainer';
import { SubmissionStep } from '@/components/waves/memes/submission/types/Steps';
import { useArtworkSubmissionForm } from '@/components/waves/memes/submission/hooks/useArtworkSubmissionForm';
import { useArtworkSubmissionMutation } from '@/components/waves/memes/submission/hooks/useArtworkSubmissionMutation';
import { useSeizeConnectContext } from '@/components/auth/SeizeConnectContext';

jest.mock('@/components/waves/memes/submission/hooks/useArtworkSubmissionForm');
jest.mock('@/components/waves/memes/submission/hooks/useArtworkSubmissionMutation');
jest.mock('@/components/auth/SeizeConnectContext');
jest.mock('@/components/waves/memes/submission/layout/ModalLayout', () => ({ children }: any) => <div>{children}</div>);
jest.mock('@/components/waves/memes/submission/steps/AgreementStep', () => (props: any) => <div data-testid="agreement" {...props} />);
let artworkProps: any;
jest.mock('@/components/waves/memes/submission/steps/ArtworkStep', () => (props: any) => {
  artworkProps = props; return <div data-testid="artwork" />;
});

const mockForm = useArtworkSubmissionForm as jest.MockedFunction<typeof useArtworkSubmissionForm>;
const mockMutation = useArtworkSubmissionMutation as jest.MockedFunction<typeof useArtworkSubmissionMutation>;
const mockSeizeConnect = useSeizeConnectContext as jest.MockedFunction<typeof useSeizeConnectContext>;

describe('MemesArtSubmissionContainer', () => {
  const wave = { id: 'w1', participation: { terms: 't' } } as any;
  const onClose = jest.fn();

  beforeEach(() => {
    artworkProps = undefined;
    mockForm.mockReturnValue({
      currentStep: SubmissionStep.ARTWORK,
      agreements: false,
      setAgreements: jest.fn(),
      handleContinueFromTerms: jest.fn(),
      traits: { title: 't', description: 'd' },
      setTraits: jest.fn(),
      updateTraitField: jest.fn(),
      artworkUploaded: false,
      artworkUrl: '',
      setArtworkUploaded: jest.fn(),
      handleFileSelect: jest.fn(),
      getSubmissionData: () => ({ traits: { title: 't' } }),
    } as any);
    mockMutation.mockReturnValue({
      submitArtwork: jest.fn(async () => 'ok'),
      uploadProgress: 0,
      submissionPhase: 'idle',
      submissionError: undefined,
      isSubmitting: false,
    } as any);
    mockSeizeConnect.mockReturnValue({
      address: '0x123',
      isSafeWallet: false,
      walletName: 'MetaMask',
      walletIcon: 'metamask-icon.svg',
      seizeConnect: jest.fn(),
      seizeDisconnect: jest.fn(),
      seizeDisconnectAndLogout: jest.fn(),
      seizeAcceptConnection: jest.fn(),
      seizeConnectOpen: false,
      isConnected: true,
      isAuthenticated: true,
    } as any);
  });

  it('auto closes on success', () => {
    jest.useFakeTimers();
    mockMutation.mockReturnValueOnce({
      submitArtwork: jest.fn(),
      uploadProgress: 0,
      submissionPhase: 'success',
      submissionError: undefined,
      isSubmitting: false,
    } as any);
    render(<MemesArtSubmissionContainer onClose={onClose} wave={wave} />);
    jest.runAllTimers();
    expect(onClose).toHaveBeenCalled();
  });

  it('submits artwork when file selected', async () => {
    const user = userEvent.setup();
    const submitArtwork = jest.fn(async () => 'result');
    mockMutation.mockReturnValueOnce({
      submitArtwork,
      uploadProgress: 0,
      submissionPhase: 'idle',
      submissionError: undefined,
      isSubmitting: false,
    } as any);
    render(<MemesArtSubmissionContainer onClose={onClose} wave={wave} />);
    const file = new File(['a'], 'a.png', { type: 'image/png' });
    await act(async () => {
      artworkProps.handleFileSelect(file);
    });
    const res = await artworkProps.onSubmit();
    expect(res).toBeTruthy();
  });
});
