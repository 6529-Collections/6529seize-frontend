import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NextGenCollectionProvenance from '../../../components/nextGen/collections/collectionParts/NextGenCollectionProvenance';
import { NextGenCollection, NextGenLog } from '../../../entities/INextgen';

jest.mock('next/image', () => ({ __esModule: true, default: (p:any) => <img {...p} /> }));
jest.mock('../../../services/api/common-api', () => ({ commonApiFetch: jest.fn() }));
jest.mock('../../../components/pagination/Pagination', () => (props: any) => (
  <button data-testid="page" onClick={() => props.setPage(props.page + 1)}>next</button>
));
jest.mock('react-bootstrap', () => {
  const React = require('react');
  const Accordion = (p:any) => <div {...p}/>;
  (Accordion as any).Item = (p:any) => <div {...p}/>;
  (Accordion as any).Button = (p:any) => <button {...p}/>;
  (Accordion as any).Body = (p:any) => <div {...p}/>;
  return {
    Container:(p:any)=><div {...p}/>,
    Row:(p:any)=><div {...p}/>,
    Col:(p:any)=><div {...p}/>,
    Accordion
  };
});

const { commonApiFetch } = require('../../../services/api/common-api');
const collection: NextGenCollection = { id: 1, name: 'Coll' } as any;
const log: NextGenLog = { id:1, block_timestamp:1, log:'test', heading:'H', transaction:'0x', collection_id:1, from_address:'0x', to_address:'0x', from_display:'', to_display:'', value:0, royalties:0, gas:0, gas_price:0, gas_gwei:0 } as any;

function setup() {
  (commonApiFetch as jest.Mock).mockResolvedValue({ count:25, page:1, next:null, data:[log] });
  return render(<NextGenCollectionProvenance collection={collection} />);
}

describe('NextGenCollectionProvenance', () => {
  beforeAll(() => {
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', { value: jest.fn(), configurable: true });
  });
  it('fetches logs and handles pagination', async () => {
    setup();
    expect(commonApiFetch).toHaveBeenCalledWith({ endpoint: `nextgen/collections/1/logs?page_size=20&page=1` });
    await screen.findByText('test');
    const btn = screen.getByTestId('page');
    (commonApiFetch as jest.Mock).mockResolvedValue({ count:25, page:2, next:null, data:[log] });
    await userEvent.click(btn);
    await waitFor(() => {
      expect(commonApiFetch).toHaveBeenLastCalledWith({ endpoint: `nextgen/collections/1/logs?page_size=20&page=2` });
    });
  });
});
