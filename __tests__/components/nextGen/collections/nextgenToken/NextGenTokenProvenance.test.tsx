import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NextGenTokenProvenance from '../../../../../components/nextGen/collections/nextgenToken/NextGenTokenProvenance';
import { NextGenCollection } from '../../../../../entities/INextgen';

jest.mock('../../../../../services/api/common-api', () => ({
  commonApiFetch: jest.fn(),
}));

jest.mock('../../../../../components/latest-activity/LatestActivityRow', () => (props: any) => (
  <tr data-testid="activity-row">{props.tr.id}</tr>
));

jest.mock('../../../../../components/nextGen/collections/collectionParts/NextGenCollectionProvenance', () => ({
  NextGenCollectionProvenanceRow: (props: any) => (
    <div data-testid="log-row">{props.log.id}</div>
  ),
}));

jest.mock('../../../../../components/pagination/Pagination', () => (props: any) => (
  <div data-testid="pagination">
    <button onClick={() => props.setPage(props.page + 1)}>next</button>
  </div>
));

jest.mock('react-bootstrap', () => {
  const React = require('react');
  return {
    Container: (p: any) => <div {...p} />,
    Row: (p: any) => <div {...p} />,
    Col: (p: any) => <div {...p} />,
    Table: (p: any) => <table {...p} />,
  };
});

const { commonApiFetch } = require('../../../../../services/api/common-api');

const collection: NextGenCollection = { id: 1 } as any;
const transaction = { id: 't1', from_address: 'a', to_address: 'b', transaction: 'tx', token_id: 7 } as any;
const log = { id: 'l1', block: 1 } as any;

function setup() {
  (commonApiFetch as jest.Mock).mockResolvedValue({ count: 26, data: [transaction] });
  return render(<NextGenTokenProvenance collection={collection} token_id={7} />);
}

describe('NextGenTokenProvenance', () => {
  beforeEach(() => jest.clearAllMocks());
  beforeAll(() => {
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
      value: jest.fn(),
      configurable: true,
    });
  });

  it('fetches provenance data and paginates', async () => {
    setup();
    expect(commonApiFetch.mock.calls[0][0]).toEqual({
      endpoint: `nextgen/tokens/7/transactions?page_size=25&page=1`,
    });
    expect(
      commonApiFetch.mock.calls.some(
        (c: any) => c[0].endpoint ===
        `nextgen/collections/1/logs/7?page_size=25&page=1`
      )
    ).toBe(true);

    await screen.findByTestId('activity-row');
    await screen.findByTestId('log-row');

    await userEvent.click(screen.getAllByText('next')[0]);
    await userEvent.click(screen.getAllByText('next')[1]);

    await waitFor(() => {
      expect(
        commonApiFetch.mock.calls.some(
          (c: any) => c[0].endpoint ===
          `nextgen/tokens/7/transactions?page_size=25&page=2`
        )
      ).toBe(true);
      expect(
        commonApiFetch.mock.calls.some(
          (c: any) => c[0].endpoint ===
          `nextgen/collections/1/logs/7?page_size=25&page=2`
        )
      ).toBe(true);
    });
  });
});
