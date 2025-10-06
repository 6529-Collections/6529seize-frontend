import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import NextGenCollectionArt from '@/components/nextGen/collections/collectionParts/NextGenCollectionArt';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

jest.mock('@/services/api/common-api', () => ({
  commonApiFetch: jest.fn(() => Promise.resolve([])),
}));

jest.mock('@/components/nextGen/collections/NextGenTokenList', () => (props: any) => (
  <div data-testid="token-list" data-limit={String(props.limit)} />
));

jest.mock('react-bootstrap', () => {
  const React = require('react');
  const RB: any = {
    Container: (p: any) => <div {...p} />,
    Row: (p: any) => <div {...p} />,
    Col: (p: any) => <div {...p} />,
    Form: (p: any) => <form {...p} />,
  };
  const Dropdown: any = (p: any) => <div {...p} />;
  Dropdown.Toggle = (p: any) => <button {...p} />;
  Dropdown.Menu = (p: any) => <div {...p} />;
  Dropdown.Item = (p: any) => <div {...p} />;
  Dropdown.Divider = (p: any) => <div {...p} />;
  RB.Dropdown = Dropdown;
  const Accordion: any = (p: any) => <div {...p} />;
  Accordion.Item = (p: any) => <div {...p} />;
  Accordion.Button = (p: any) => <button {...p} />;
  Accordion.Body = (p: any) => <div {...p} />;
  RB.Accordion = Accordion;
  return RB;
});

jest.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: (p: any) => <svg {...p} />,
}));


jest.mock('@/helpers/AllowlistToolHelpers', () => ({
  getRandomObjectId: () => 'id',
}));

jest.mock('@/components/dotLoader/DotLoader', () => () => <div data-testid="loader" />);
jest.mock("@/components/nextGen/nextgen_helpers", () => ({
  formatNameForUrl: (s: string) => s,
  NextGenListFilters: { ID: "ID" },
  NextGenTokenListedType: { ALL: "ALL", LISTED: "LISTED", NOT_LISTED: "NOT_LISTED" },
}));

const { commonApiFetch } = require('@/services/api/common-api');

const collection = { id: 1, name: 'Cool' } as any;

describe('NextGenCollectionArt', () => {
  beforeEach(() => {
    (commonApiFetch as jest.Mock).mockClear();
  });

  it('shows view all link and renders token list with limit', async () => {
    (commonApiFetch as jest.Mock).mockResolvedValue([]);
    render(<NextGenCollectionArt collection={collection} show_view_all />);
    await waitFor(() => expect(commonApiFetch).toHaveBeenCalled());
    const link = screen.getByRole('link', { name: /View All/i });
    expect(link).toHaveAttribute('href', '/nextgen/collection/Cool/art');
    await screen.findByTestId('token-list');
    expect(screen.getByTestId('token-list')).toHaveAttribute('data-limit', '6');
  });

  it('hides view all link and passes undefined limit when not show_view_all', async () => {
    render(<NextGenCollectionArt collection={collection} />);
    await screen.findByTestId('token-list');
    expect(screen.queryByRole('link', { name: /View All/i })).toBeNull();
    expect(screen.getByTestId('token-list')).toHaveAttribute('data-limit', 'undefined');
    expect(commonApiFetch).toHaveBeenCalledWith({ endpoint: 'nextgen/collections/1/traits' });
  });

  it('hides filters on small screens', async () => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 500 });
    render(<NextGenCollectionArt collection={collection} />);
    await screen.findByTestId('token-list');
    expect(screen.queryByText('Traits')).toBeNull();
  });
});
