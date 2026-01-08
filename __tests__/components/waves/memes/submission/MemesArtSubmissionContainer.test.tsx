import { render, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import MemesArtSubmissionContainer from '@/components/waves/memes/submission/MemesArtSubmissionContainer';
import { SubmissionStep } from '@/components/waves/memes/submission/types/Steps';
import { useArtworkSubmissionForm } from '@/components/waves/memes/submission/hooks/useArtworkSubmissionForm';
import { useArtworkSubmissionMutation } from '@/components/waves/memes/submission/hooks/useArtworkSubmissionMutation';
import { useSeizeConnectContext } from '@/components/auth/SeizeConnectContext';
import type { InteractiveMediaMimeType } from '@/components/waves/memes/submission/constants/media';

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
    const formState: any = {
      currentStep: SubmissionStep.ARTWORK,
      agreements: false,
      setAgreements: jest.fn(),
      handleContinueFromTerms: jest.fn(),
      handleContinueFromArtwork: jest.fn(async () => true),
      traits: { title: 't', description: 'd' },
      setTraits: jest.fn(),
      updateTraitField: jest.fn(),
      artworkUploaded: false,
      artworkUrl: '',
      selectedFile: null,
      mediaSource: 'upload',
      externalMediaUrl: '',
      externalMediaPreviewUrl: '',
      externalMediaHashInput: '',
      externalMediaProvider: 'ipfs',
      externalMediaMimeType: 'text/html',
      externalMediaError: null,
      externalMediaValidationStatus: 'idle',
      isExternalMediaValid: false,
      operationalData: {
        airdrop_config: [{ id: "test-initial", address: "", count: 20 }],
        payment_info: {
          payment_address: "",
        },
        allowlist_batches: [],
        additional_media: {
          artist_profile_media: [],
          artwork_commentary_media: [],
        },
        commentary: "",
      },
      setAirdropConfig: jest.fn(),
      setPaymentInfo: jest.fn(),
      setAllowlistBatches: jest.fn(),
      setAdditionalMedia: jest.fn(),
      setCommentary: jest.fn(),
      handleBackToArtwork: jest.fn(),
    };

    formState.setArtworkUploaded = jest.fn((value: boolean) => {
      formState.artworkUploaded = value;
      if (!value) {
        formState.selectedFile = null;
      }
    });

    formState.handleFileSelect = jest.fn((file: File) => {
      formState.selectedFile = file;
      formState.artworkUploaded = true;
      formState.artworkUrl = 'object-url';
    });

    formState.setMediaSource = jest.fn((mode: 'upload' | 'url') => {
      formState.mediaSource = mode;
    });

    formState.setExternalMediaHash = jest.fn((hash: string) => {
      formState.externalMediaHashInput = hash;
      if (hash) {
        formState.externalMediaUrl = `${formState.externalMediaProvider === 'arweave' ? 'https://arweave.net/' : 'ipfs://'}${hash}`;
        formState.externalMediaPreviewUrl =
          formState.externalMediaProvider === 'arweave'
            ? `https://arweave.net/${hash}`
            : `https://ipfs.io/ipfs/${hash}`;
        formState.isExternalMediaValid = true;
        formState.externalMediaValidationStatus = 'valid';
        formState.externalMediaError = null;
      } else {
        formState.externalMediaUrl = '';
        formState.externalMediaPreviewUrl = '';
        formState.isExternalMediaValid = false;
        formState.externalMediaValidationStatus = 'idle';
        formState.externalMediaError = null;
      }
    });

    formState.setExternalMediaProvider = jest.fn((provider: 'ipfs' | 'arweave') => {
      formState.externalMediaProvider = provider;
      formState.setExternalMediaHash(formState.externalMediaHashInput);
    });

    formState.setExternalMediaMimeType = jest.fn(
      (mimeType: InteractiveMediaMimeType) => {
        formState.externalMediaMimeType = mimeType;
      }
    );

    formState.clearExternalMedia = jest.fn(() => {
      formState.externalMediaHashInput = '';
      formState.externalMediaUrl = '';
      formState.externalMediaPreviewUrl = '';
      formState.isExternalMediaValid = false;
       formState.externalMediaValidationStatus = 'idle';
      formState.externalMediaError = null;
    });

    formState.getSubmissionData = () => ({ traits: { title: 't' } });
    formState.getMediaSelection = jest.fn(() => ({
      mediaSource: formState.mediaSource,
      selectedFile: formState.selectedFile,
      externalUrl: formState.externalMediaUrl,
      externalPreviewUrl: formState.externalMediaPreviewUrl,
      externalProvider: formState.externalMediaProvider,
      externalHash: formState.externalMediaHashInput,
      externalMimeType: formState.externalMediaMimeType,
      isExternalValid: formState.isExternalMediaValid,
    }));

    mockForm.mockReturnValue(formState);
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
