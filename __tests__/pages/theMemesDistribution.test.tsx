import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import Page, { getServerSideProps } from '../../pages/the-memes/[id]/distribution';
import { getSharedServerSideProps } from '../../components/the-memes/MemeShared';
import { MEMES_CONTRACT } from '../../constants';

jest.mock('next/dynamic', () => () => {
  return function DynamicComponent(props: any) {
    return <div data-testid="distribution" {...props} />;
  };
});
jest.mock('../../components/the-memes/MemeShared');

const mockShared = getSharedServerSideProps as jest.Mock;

describe('Meme Distribution Page', () => {
  it('renders distribution component', () => {
    render(<Page />);
    expect(document.querySelector('[data-testid="distribution"]')).toBeInTheDocument();
  });

  it('delegates getServerSideProps', async () => {
    mockShared.mockResolvedValue({ props: { foo: 'bar' } });
    const res = await getServerSideProps({} as any, null as any, null as any);
    expect(mockShared).toHaveBeenCalledWith({}, MEMES_CONTRACT, true);
    expect(res).toEqual({ props: { foo: 'bar' } });
  });
});
