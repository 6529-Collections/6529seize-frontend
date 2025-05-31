import { render } from '@testing-library/react';
import React from 'react';
import MemePage, { getServerSideProps } from '../../pages/the-memes/[id]';
import { getSharedServerSideProps } from '../../components/the-memes/MemeShared';

jest.mock('next/dynamic', () => () => () => <div data-testid="dynamic" />);
jest.mock('../../components/the-memes/MemeShared');

const mockGetShared = getSharedServerSideProps as jest.Mock;

describe('MemePage', () => {
  it('renders component', () => {
    render(<MemePage />);
  });
});

describe('MemePage getServerSideProps', () => {
  it('delegates to getSharedServerSideProps', async () => {
    mockGetShared.mockResolvedValue({ props: { id: '1' } });
    const result = await getServerSideProps({ query: { id: '1' } } as any, null as any, null as any);
    expect(mockGetShared).toHaveBeenCalledWith({ query: { id: '1' } }, '0x33FD426905F149f8376e227d0C9D3340AaD17aF1');
    expect(result).toEqual({ props: { id: '1' } });
  });
});
