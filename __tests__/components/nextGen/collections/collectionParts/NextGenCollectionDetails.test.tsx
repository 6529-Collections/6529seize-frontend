import React from 'react';
import { render, screen } from '@testing-library/react';
import NextGenCollectionDetails from '../../../../../components/nextGen/collections/collectionParts/NextGenCollectionDetails';
import { ContentView } from '../../../../../components/nextGen/collections/collectionParts/NextGenCollection';
import { NextGenCollection } from '../../../../../../entities/INextgen';

jest.mock('../../../../../components/nextGen/collections/collectionParts/NextGenCollectionProvenance', () => ({ __esModule: true, default: () => <div data-testid="provenance" /> }));
jest.mock('../../../../../components/nextGen/collections/collectionParts/NextGenTraitSets', () => ({ __esModule: true, default: () => <div data-testid="traits" /> }));

const collection = { name: 'Test', description: 'Desc', licence: '', artist_signature:'' } as NextGenCollection;

describe('NextGenCollectionDetails', () => {
  it('renders provenance view', () => {
    render(<NextGenCollectionDetails collection={collection} view={ContentView.PROVENANCE} />);
    expect(screen.getByTestId('provenance')).toBeInTheDocument();
  });

  it('renders overview view', () => {
    render(<NextGenCollectionDetails collection={collection} view={ContentView.OVERVIEW} />);
    expect(screen.getByText('Collection Overview')).toBeInTheDocument();
  });

  it('renders trait sets view', () => {
    render(<NextGenCollectionDetails collection={collection} view={ContentView.TOP_TRAIT_SETS} />);
    expect(screen.getByTestId('traits')).toBeInTheDocument();
  });

});
