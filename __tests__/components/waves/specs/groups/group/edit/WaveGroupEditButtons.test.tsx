import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import WaveGroupEditButtons from '@/components/waves/specs/groups/group/edit/WaveGroupEditButtons';
import { WaveGroupType } from '@/components/waves/specs/groups/group/WaveGroup';
import { AuthContext } from '@/components/auth/Auth';
import { ReactQueryWrapperContext } from '@/components/react-query-wrapper/ReactQueryWrapper';
import { useMutation } from '@tanstack/react-query';

jest.mock('@tanstack/react-query', () => ({ useMutation: jest.fn() }));

jest.mock('@/components/waves/specs/groups/group/edit/WaveGroupEditButton', () => ({
  __esModule: true,
  default: ({ onEdit }: any) => <button onClick={() => onEdit({})}>edit</button>,
}));

jest.mock('@/components/waves/specs/groups/group/edit/WaveGroupRemoveButton', () => ({
  __esModule: true,
  default: ({ onEdit }: any) => <button onClick={() => onEdit({})}>remove</button>,
}));

jest.mock('@/components/distribution-plan-tool/common/CircleLoader', () => ({
  __esModule: true,
  default: () => <div data-testid="loader" />,
}));

const mutateAsync = jest.fn();
(useMutation as jest.Mock).mockReturnValue({ mutateAsync });

const auth = {
  setToast: jest.fn(),
  requestAuth: jest.fn().mockResolvedValue({ success: true }),
} as any;

const wrapper = ({ children }: any) => (
  <AuthContext.Provider value={auth}>
    <ReactQueryWrapperContext.Provider value={{ onWaveCreated: jest.fn() }}>
      {children}
    </ReactQueryWrapperContext.Provider>
  </AuthContext.Provider>
);

const wave: any = { id: 'w1' };

describe('WaveGroupEditButtons', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls mutate on edit', async () => {
    render(<WaveGroupEditButtons haveGroup wave={wave} type={WaveGroupType.VIEW} />, { wrapper });
    fireEvent.click(screen.getByText('edit'));
    await waitFor(() => expect(auth.requestAuth).toHaveBeenCalled());
    expect(mutateAsync).toHaveBeenCalled();
  });

  it('shows error toast when auth fails', async () => {
    auth.requestAuth.mockResolvedValueOnce({ success: false });
    render(<WaveGroupEditButtons haveGroup wave={wave} type={WaveGroupType.VIEW} />, { wrapper });
    fireEvent.click(screen.getByText('edit'));
    await waitFor(() => expect(auth.setToast).toHaveBeenCalled());
  });

  it('hides remove button for admin type', () => {
    const { queryByText } = render(<WaveGroupEditButtons haveGroup wave={wave} type={WaveGroupType.ADMIN} />, { wrapper });
    expect(queryByText('remove')).toBeNull();
  });
});
