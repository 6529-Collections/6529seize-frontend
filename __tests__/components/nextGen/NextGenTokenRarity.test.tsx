import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NextgenTokenRarity from '../../../components/nextGen/collections/nextgenToken/NextGenTokenProperties';

jest.mock('react-bootstrap', () => {
  const React = require('react');
  const Accordion: any = ({ children }: any) => <div>{children}</div>;
  Accordion.Item = ({ children }: any) => <div>{children}</div>;
  Accordion.Button = ({ children, ...props }: any) => <button {...props}>{children}</button>;
  Accordion.Body = ({ children }: any) => <div>{children}</div>;
  return {
    Accordion,
    Container: (p: any) => <div {...p} />,
    Row: (p: any) => <div {...p} />,
    Col: (p: any) => <div {...p} />,
  };
});

jest.mock('react-toggle', () => (props: any) => <input type="checkbox" {...props} />);

const baseProps = {
  collection: { name: 'Cool' } as any,
  tokenCount: 100,
  token: {
    name: 'Token',
    rarity_score_trait_count_normalised: 1,
    rarity_score_normalised: 2,
    rarity_score_trait_count: 3,
    rarity_score: 4,
    rarity_score_trait_count_normalised_rank: 11,
    rarity_score_normalised_rank: 12,
    rarity_score_trait_count_rank: 13,
    rarity_score_rank: 14,
    statistical_score_trait_count_normalised: 5,
    statistical_score_normalised: 6,
    statistical_score_trait_count: 7,
    statistical_score: 8,
    statistical_score_trait_count_normalised_rank: 21,
    statistical_score_normalised_rank: 22,
    statistical_score_trait_count_rank: 23,
    statistical_score_rank: 24,
    single_trait_rarity_score_trait_count_normalised: 9,
    single_trait_rarity_score_normalised: 10,
    single_trait_rarity_score_trait_count: 11,
    single_trait_rarity_score: 12,
    single_trait_rarity_score_trait_count_normalised_rank: 31,
    single_trait_rarity_score_normalised_rank: 32,
    single_trait_rarity_score_trait_count_rank: 33,
    single_trait_rarity_score_rank: 34,
  } as any,
  traits: [
    {
      trait: 'Background',
      value: 'Red',
      rarity_score_trait_count_normalised: 0.1,
      rarity_score_normalised: 0.2,
      rarity_score: 0.3,
      rarity_score_trait_count_normalised_rank: 1,
      rarity_score_normalised_rank: 2,
      rarity_score_rank: 3,
      statistical_rarity_normalised: 0.4,
      statistical_rarity: 0.5,
      statistical_rarity_normalised_rank: 4,
      statistical_rarity_rank: 5,
      single_trait_rarity_score_normalised: 0.6,
      single_trait_rarity_score_normalised_rank: 6,
      single_trait_rarity_score_trait_count_normalised: 0.7,
      single_trait_rarity_score_trait_count_normalised_rank: 7,
      single_trait_rarity_score_trait_count_rank: 8,
      single_trait_rarity_score_trait_count: 0.8,
      trait_count: 10,
      value_count: 2,
      token_count: 100,
    },
  ] as any,
};

function renderComp() {
  return render(<NextgenTokenRarity {...baseProps} />);
}

describe('NextgenTokenRarity', () => {
  beforeEach(() => {
    // Mock toLocaleString to ensure English locale for consistent decimal formatting
    const originalToLocaleString = Number.prototype.toLocaleString;
    jest.spyOn(Number.prototype, 'toLocaleString').mockImplementation(function(this: number, locales?: string | string[], options?: Intl.NumberFormatOptions) {
      return originalToLocaleString.call(this, 'en-US', options);
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('shows token count and initial score', () => {
    renderComp();
    expect(screen.getByText('Token Count: 100')).toBeInTheDocument();
    expect(screen.getByText('1.000')).toBeInTheDocument();
  });

  it('updates score when toggling trait count', async () => {
    const user = userEvent.setup();
    renderComp();
    const toggle = screen.getByLabelText('Trait Count');
    await user.click(toggle);
    expect(toggle).not.toBeChecked();
    expect(screen.getByText('2.000')).toBeInTheDocument();
  });
});
