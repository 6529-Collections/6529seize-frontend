import React from 'react';
import { render, screen } from '@testing-library/react';
import WaveGroup, { WaveGroupType } from '@/components/waves/specs/groups/group/WaveGroup';
import { AuthContext } from '@/components/auth/Auth';

jest.mock('@/components/waves/specs/groups/group/WaveGroupTitle', () => () => <div data-testid="title" />);
jest.mock('@/components/waves/specs/groups/group/edit/WaveGroupEditButtons', () => () => <div data-testid="edit" />);
jest.mock('@/components/waves/specs/groups/group/WaveGroupScope', () => ({ group }: any) => group ? <div data-testid="scope" /> : <span>Anyone</span>);

jest.mock('@/helpers/waves/waves.helpers', () => ({ canEditWave: jest.fn() }));
jest.mock('@/hooks/isMobileDevice', () => ({ __esModule: true, default: jest.fn() }));

const canEditWave = require('@/helpers/waves/waves.helpers').canEditWave as jest.Mock;
const useIsMobileDevice = require('@/hooks/isMobileDevice').default as jest.Mock;

const auth = { connectedProfile: { handle: 'a' }, activeProfileProxy: null } as any;
const wrapper = ({ children }: any) => (
  <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>
);

const baseProps = { wave: { id: 'w1' } as any, type: WaveGroupType.VIEW, isEligible: true };

describe('WaveGroup', () => {
  beforeEach(() => {
    canEditWave.mockReturnValue(true);
    useIsMobileDevice.mockReturnValue(false);
  });

  afterEach(() => jest.clearAllMocks());

  it('shows edit buttons when editable', () => {
    const scope = { group: { is_direct_message: false } } as any;
    render(<WaveGroup {...baseProps} scope={scope} />, { wrapper });
    expect(screen.getByTestId('edit')).toBeInTheDocument();
  });

  it('hides edit buttons when cannot edit', () => {
    canEditWave.mockReturnValue(false);
    const scope = { group: { is_direct_message: false } } as any;
    render(<WaveGroup {...baseProps} scope={scope} />, { wrapper });
    expect(screen.queryByTestId('edit')).toBeNull();
  });

  it('shows "Anyone" when no group provided', () => {
    render(<WaveGroup {...baseProps} scope={{} as any} />, { wrapper });
    expect(screen.getByText('Anyone')).toBeInTheDocument();
  });
});
