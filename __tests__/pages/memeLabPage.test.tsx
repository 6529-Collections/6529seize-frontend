// @ts-nocheck
import { render, screen } from '@testing-library/react';
import React from 'react';
import MemeLabPage, { getServerSideProps } from '../../pages/meme-lab/[id]';
import { AuthContext } from '../../components/auth/Auth';
import { createMockAuthContext } from '../utils/testContexts';
import { getSharedServerSideProps } from '../../components/the-memes/MemeShared';

jest.mock('next/dynamic', () => () => () => <div data-testid="dynamic" />);
jest.mock('../../components/memelab/MemeLabPage', () => () => <div data-testid="lab" />);
jest.mock('../../components/the-memes/MemeShared', () => ({ getSharedServerSideProps: jest.fn(() => ({ props: {} })) }));

const auth = createMockAuthContext({ connectedProfile: { wallets: [{ wallet: '0x1' }] } as any });

describe('MemeLabPage', () => {
  it('renders lab component with connected wallets', () => {
    render(
      <AuthContext.Provider value={auth}>
        <MemeLabPage />
      </AuthContext.Provider>
    );
    expect(screen.getByTestId('dynamic')).toBeInTheDocument();
  });

  it('calls shared server side props', async () => {
    await getServerSideProps({}, {}, '/');
    expect(getSharedServerSideProps).toHaveBeenCalled();
  });
});
