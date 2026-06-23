// Mock react-dom before imports so createPortal renders inline
jest.mock('react-dom', () => ({
  ...jest.requireActual('react-dom'),
  createPortal: (node: React.ReactNode) => node,
}));

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Modal from '@/components/user/rep/modify-rep/UserPageRepModifyModal';
import { AuthContext } from '@/components/auth/Auth';
import { ReactQueryWrapperContext } from '@/components/react-query-wrapper/ReactQueryWrapper';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useRepAllocation } from '@/hooks/useRepAllocation';

jest.mock('@tanstack/react-query');
jest.mock('@/hooks/useRepAllocation');

const useQueryMock = useQuery as jest.Mock;
const useMutationMock = useMutation as jest.Mock;
const useRepAllocationMock = useRepAllocation as jest.Mock;

const auth = {
  requestAuth: jest.fn().mockResolvedValue({ success: false }),
  setToast: jest.fn(),
  connectedProfile: null,
  activeProfileProxy: null,
} as any;

const rq = { onProfileRepModify: jest.fn() } as any;

beforeEach(() => {
  jest.clearAllMocks();
  useQueryMock.mockReturnValue({});
  useMutationMock.mockReturnValue({ mutateAsync: jest.fn() });
  useRepAllocationMock.mockImplementation(({ category }: { category: string }) => ({
    repState: {
      category,
      rating: 1234,
      contributor_count: 7,
      rater_contribution: 1234,
    },
    heroAvailableRep: 5000,
    minMaxValues: { min: -5000, max: 5000 },
    proxyAvailableCredit: null,
  }));
});

describe('UserPageRepModifyModal — edit mode (canEditRep=true)', () => {
  it('calls onClose when cancel clicked', async () => {
    const onClose = jest.fn();
    render(
      <ReactQueryWrapperContext.Provider value={rq}>
        <AuthContext.Provider value={auth}>
          <Modal onClose={onClose} profile={{} as any} category="cat" canEditRep={true} />
        </AuthContext.Provider>
      </ReactQueryWrapperContext.Provider>
    );

    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onClose).toHaveBeenCalled();
  });

  it('disables save button initially', () => {
    render(
      <ReactQueryWrapperContext.Provider value={rq}>
        <AuthContext.Provider value={auth}>
          <Modal onClose={() => {}} profile={{} as any} category="cat" canEditRep={true} />
        </AuthContext.Provider>
      </ReactQueryWrapperContext.Provider>
    );
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
  });
});

describe('UserPageRepModifyModal — allocation form', () => {
  it('renders category name and allocation controls', () => {
    render(
      <ReactQueryWrapperContext.Provider value={rq}>
        <AuthContext.Provider value={auth}>
          <Modal
            onClose={() => {}}
            profile={{ handle: 'alice', primary_wallet: '0x1' } as any}
            category="Artist"
            canEditRep={false}
            categoryRep={1234}
            contributorCount={7}
          />
        </AuthContext.Provider>
      </ReactQueryWrapperContext.Provider>
    );

    expect(screen.getByText('Artist')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });

  it('renders the edit form even when legacy canEditRep prop is false', () => {
    render(
      <ReactQueryWrapperContext.Provider value={rq}>
        <AuthContext.Provider value={auth}>
          <Modal
            onClose={() => {}}
            profile={{ handle: 'alice', primary_wallet: '0x1' } as any}
            category="Artist"
            canEditRep={false}
            categoryRep={100}
            contributorCount={3}
          />
        </AuthContext.Provider>
      </ReactQueryWrapperContext.Provider>
    );

    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });

  it('calls onClose when close button clicked', async () => {
    const onClose = jest.fn();
    render(
      <ReactQueryWrapperContext.Provider value={rq}>
        <AuthContext.Provider value={auth}>
          <Modal
            onClose={onClose}
            profile={{ handle: 'alice', primary_wallet: '0x1' } as any}
            category="Artist"
            canEditRep={false}
            categoryRep={100}
            contributorCount={3}
          />
        </AuthContext.Provider>
      </ReactQueryWrapperContext.Provider>
    );

    await userEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalled();
  });
});
