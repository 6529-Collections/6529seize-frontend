import React from 'react';
import { render } from '@testing-library/react';
import NextGenCollectionArtPage from '../../../../../../components/nextGen/collections/collectionParts/art/NextGenCollectionArtPage';
import { NextGenCollection } from '../../../../../../entities/INextgen';

let headerProps: any = null;
let artProps: any = null;

jest.mock('../../../../../../components/nextGen/collections/collectionParts/NextGenCollectionHeader', () => (props: any) => {
  headerProps = props;
  return <div data-testid="header" />;
});

jest.mock('../../../../../../components/nextGen/collections/collectionParts/NextGenCollectionArt', () => (props: any) => {
  artProps = props;
  return <div data-testid="art" />;
});

jest.mock('../../../../../../components/nextGen/collections/NextGenNavigationHeader', () => () => <div data-testid="nav" />);

describe('NextGenCollectionArtPage', () => {
  beforeEach(() => {
    headerProps = null;
    artProps = null;
  });

  it('renders navigation header and passes collection to child components', () => {
    const collection = { id: 1, name: 'Cool' } as NextGenCollection;
    render(<NextGenCollectionArtPage collection={collection} />);
    expect(headerProps).toEqual({ collection, collection_link: true });
    expect(artProps).toEqual({ collection });
  });
});
