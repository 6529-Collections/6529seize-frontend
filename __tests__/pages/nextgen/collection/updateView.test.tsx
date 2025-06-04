import React from 'react';
import { render } from '@testing-library/react';
import NextGenCollectionPage from '../../../../pages/nextgen/collection/[collection]/[[...view]]/index';
import { ContentView } from '../../../../components/nextGen/collections/collectionParts/NextGenCollection';
import { useRouter } from 'next/router';

jest.mock('next/router', () => ({ useRouter: jest.fn() }));

const push = jest.fn();
(useRouter as jest.Mock).mockReturnValue({ push, replace: jest.fn(), asPath:'/' , query:{} });

let setViewFn: any;
jest.mock('next/dynamic', () => () => (props: any) => { setViewFn = props.setView; return <div data-testid="collection" />; });

jest.mock('../../../../components/auth/Auth', () => ({
  AuthContext: React.createContext({ setTitle: jest.fn() })
}));

describe('NextGenCollectionPage updateView', () => {
  it('pushes new url when view changes', () => {
    render(
      <NextGenCollectionPage pageProps={{ collection: { name: 'Cool' }, view: ContentView.OVERVIEW }} />
    );
    setViewFn(ContentView.PROVENANCE);
    expect(push).toHaveBeenCalledWith('/nextgen/collection/cool/provenance', undefined, { shallow: true });
  });
});
