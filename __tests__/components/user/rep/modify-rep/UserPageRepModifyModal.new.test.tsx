import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Modal from '../../../../../components/user/rep/modify-rep/UserPageRepModifyModal';
import { AuthContext } from '../../../../../components/auth/Auth';
import { ReactQueryWrapperContext } from '../../../../../components/react-query-wrapper/ReactQueryWrapper';
import { useQuery, useMutation } from '@tanstack/react-query';

jest.mock('@tanstack/react-query');

const useQueryMock = useQuery as jest.Mock;
const useMutationMock = useMutation as jest.Mock;

useQueryMock.mockReturnValue({});
useMutationMock.mockReturnValue({ mutateAsync: jest.fn() });

const defaultCtx = {
  requestAuth: jest.fn().mockResolvedValue({ success: false }),
  setToast: jest.fn(),
  setTitle: jest.fn(),
  connectedProfile: null,
  activeProfileProxy: null,
};

describe('UserPageRepModifyModal', () => {
  it('calls onClose when cancel clicked', async () => {
    const onClose = jest.fn();
    render(
      <ReactQueryWrapperContext.Provider value={{ onProfileRepModify: jest.fn() }}>
        <AuthContext.Provider value={defaultCtx as any}>
          <Modal onClose={onClose} profile={{} as any} category="cat" />
        </AuthContext.Provider>
      </ReactQueryWrapperContext.Provider>
    );

    const cancel = screen.getByRole('button', { name: 'Cancel' });
    await userEvent.click(cancel);
    expect(onClose).toHaveBeenCalled();
  });

  it('disables save button initially', () => {
    render(
      <ReactQueryWrapperContext.Provider value={{ onProfileRepModify: jest.fn() }}>
        <AuthContext.Provider value={defaultCtx as any}>
          <Modal onClose={() => {}} profile={{} as any} category="cat" />
        </AuthContext.Provider>
      </ReactQueryWrapperContext.Provider>
    );
    const save = screen.getByRole('button', { name: 'Save' });
    expect(save).toBeDisabled();
  });
});
