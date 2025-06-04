import React from 'react';
import { render, screen } from '@testing-library/react';
import MemesArtSubmissionFile from '../../../../components/waves/memes/MemesArtSubmissionFile';
import { AuthContext } from '../../../../components/auth/Auth';

beforeAll(() => {
  (window as any).matchMedia = () => ({ matches: false, addListener: jest.fn(), removeListener: jest.fn() });
});

jest.mock('../../../../components/waves/memes/file-upload/components/FilePreview', () => (props: any) => <div data-testid="preview">{props.url}</div>);
jest.mock('../../../../components/waves/memes/file-upload/components/UploadArea', () => (props: any) => <div data-testid="upload" />);
jest.mock('../../../../components/waves/memes/file-upload/components/BrowserWarning', () => ({ reason }: any) => <div data-testid="warning">{reason}</div>);

jest.mock('../../../../components/waves/memes/file-upload/hooks/useFileUploader', () => () => ({
  state: { visualState: 'idle', error: null, objectUrl: null, hasRecoveryOption:false, currentFile:null, videoCompatibility:null, isCheckingCompatibility:false },
  processFile: jest.fn(),
  handleRetry: jest.fn(),
  handleRemoveFile: jest.fn(),
  dispatch: jest.fn(),
}));

jest.mock('../../../../components/waves/memes/file-upload/hooks/useDragAndDrop', () => () => ({
  dropAreaRef: { current: null },
  handleDragEnter: jest.fn(),
  handleDragOver: jest.fn(),
  handleDragLeave: jest.fn(),
  handleDrop: jest.fn(),
}));

jest.mock('../../../../components/waves/memes/file-upload/hooks/useAccessibility', () => () => ({
  handleKeyDown: jest.fn(),
}));

jest.mock('../../../../components/waves/memes/file-upload/utils/browserDetection', () => ({ isBrowserSupported: () => ({ supported: false, reason: 'bad' }) }));

describe('MemesArtSubmissionFile', () => {
  it('shows warning when browser unsupported and renders upload area', () => {
    const setToast = jest.fn();
    render(
      <AuthContext.Provider value={{ setToast } as any}>
        <MemesArtSubmissionFile artworkUploaded={false} artworkUrl="url" setArtworkUploaded={jest.fn()} handleFileSelect={jest.fn()} />
      </AuthContext.Provider>
    );
    expect(screen.getByTestId('warning')).toHaveTextContent('bad');
    expect(setToast).toHaveBeenCalled();
    expect(screen.getByTestId('upload')).toBeInTheDocument();
  });

  it('renders preview when artwork uploaded', () => {
    render(
      <AuthContext.Provider value={{ setToast: jest.fn() } as any}>
        <MemesArtSubmissionFile artworkUploaded={true} artworkUrl="the-url" setArtworkUploaded={jest.fn()} handleFileSelect={jest.fn()} />
      </AuthContext.Provider>
    );
    expect(screen.getByTestId('preview')).toHaveTextContent('the-url');
  });
});
