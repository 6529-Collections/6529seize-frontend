import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import CreateDropContent from '../../../components/waves/CreateDropContent';
import { AuthContext } from '../../../components/auth/Auth';
import { MAX_DROP_UPLOAD_FILES } from '../../../helpers/Helpers';

jest.mock('../../../components/waves/CreateDropInput', () => ({ __esModule: true, default: React.forwardRef(() => <div />) }));
jest.mock('../../../components/waves/CreateDropMetadata', () => ({ __esModule: true, default: () => <div /> }));
jest.mock('../../../components/waves/CreateDropActions', () => ({ __esModule: true, default: (props: any) => (
  <label aria-label="Upload a file"><input type="file" multiple onChange={e => props.handleFileChange(Array.from(e.target.files!))} /></label>
)}));
jest.mock('../../../components/waves/CreateDropDropModeToggle', () => ({ __esModule: true, CreateDropDropModeToggle: () => <div /> }));
jest.mock('../../../components/waves/CreateDropSubmit', () => ({ __esModule: true, CreateDropSubmit: () => <button>submit</button> }));
jest.mock('../../../components/terms/TermsSignatureFlow', () => ({ __esModule: true, default: () => <div /> }));
jest.mock('../../../hooks/useDropPriviledges', () => ({ __esModule: true, DropPrivileges: {} }));
jest.mock('../../../hooks/drops/useDropSignature', () => ({ __esModule: true, useDropSignature: () => ({ signDrop: jest.fn() }) }));
jest.mock('../../../hooks/useWave', () => ({ __esModule: true, useWave: () => ({ isMemesWave: false }) }));
jest.mock('../../../contexts/wave/MyStreamContext', () => ({ __esModule: true, useMyStream: () => ({ processIncomingDrop: jest.fn() }) }));
jest.mock('../../../services/websocket', () => ({ __esModule: true, useWebSocket: () => ({ send: jest.fn() }) }));
jest.mock('../../../components/waves/CreateDropContentFiles', () => ({ __esModule: true, CreateDropContentFiles: () => <div /> }));
jest.mock('../../../components/waves/CreateDropContentRequirements', () => ({ __esModule: true, default: () => <div /> }));
jest.mock('../../../components/waves/CreateDropReplyingWrapper', () => ({ __esModule: true, default: () => <div /> }));

const wave: any = {
  id: '1',
  name: 'w',
  picture: null,
  description_drop: { id: 'd' },
  participation: { authenticated_user_eligible: true, required_metadata: [], required_media: [], signature_required: false, terms: null },
  voting: { authenticated_user_eligible: true, credit_type: 'UP_ONLY', forbid_negative_votes: false },
  chat: { authenticated_user_eligible: true },
  wave: { type: 'Chat' }
};

describe('CreateDropContent', () => {
  it('limits number of uploaded files', () => {
    const setToast = jest.fn();
    const { getByLabelText } = render(
      <AuthContext.Provider value={{ setToast } as any}>
        <CreateDropContent
          activeDrop={null}
          onCancelReplyQuote={() => {}}
          wave={wave}
          drop={null}
          isStormMode={false}
          isDropMode={false}
          dropId={null}
          setDrop={jest.fn()}
          setIsStormMode={jest.fn()}
          onDropModeChange={jest.fn()}
          submitDrop={jest.fn()}
          privileges={{} as any}
        />
      </AuthContext.Provider>
    );
    const input = getByLabelText('Upload a file').querySelector('input') as HTMLInputElement;
    const files = Array.from({ length: MAX_DROP_UPLOAD_FILES + 2 }, (_, i) => new File(['a'], `f${i}.png`, { type: 'image/png' }));
    fireEvent.change(input, { target: { files } });
    expect(setToast).toHaveBeenCalled();
  });
});
