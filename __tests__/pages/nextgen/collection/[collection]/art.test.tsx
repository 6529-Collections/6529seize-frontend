import React from 'react';
import { render } from '@testing-library/react';
import Page, { getServerSideProps } from '../../../../../pages/nextgen/collection/[collection]/art';

let headerProps: any = null;
let listProps: any = null;

jest.mock('../../../../../components/nextGen/collections/collectionParts/NextGenCollectionHeader', () => ({
  NextGenCollectionHead: (props: any) => {
    headerProps = props;
    return <div data-testid="header" />;
  },
  getServerSideCollection: jest.fn(() => Promise.resolve({ props: { collection: { name: 'c' } } })),
}));

jest.mock('next/dynamic', () => () => (props: any) => {
  listProps = props;
  return <div data-testid="dynamic" />;
});

const { getServerSideCollection } = require('../../../../../components/nextGen/collections/collectionParts/NextGenCollectionHeader');

describe('NextGen collection art page', () => {
  beforeEach(() => {
    headerProps = null;
    listProps = null;
  });

  it('passes collection to child components', () => {
    const props = { pageProps: { collection: { id: 1, name: 'Cool' } } } as any;
    render(<Page {...props} />);
    expect(headerProps).toEqual({ collection: props.pageProps.collection });
    expect(listProps).toEqual({ collection: props.pageProps.collection });
  });

  it('delegates getServerSideProps', async () => {
    const req = {} as any;
    const res = {} as any;
    const result = await getServerSideProps(req, res, '/p');
    expect(getServerSideCollection).toHaveBeenCalledWith(req, 'Art');
    expect(result).toEqual(await getServerSideCollection.mock.results[0].value);
  });
});
