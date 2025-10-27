import { render, screen } from '@testing-library/react';
import CommonProfileSearchItems from '@/components/utils/input/profile-search/CommonProfileSearchItems';

jest.mock('@/components/utils/input/profile-search/CommonProfileSearchItem', () => (props: any) => (
  <li data-testid="item" id={props.id} data-highlighted={props.isHighlighted}>
    {props.profile.wallet}
  </li>
));

describe('CommonProfileSearchItems', () => {
  const profiles = [
    { wallet: 'a' },
    { wallet: 'b' },
  ] as any[];

  it('renders items when open', () => {
    render(
      <CommonProfileSearchItems open profiles={profiles} selected={null} searchCriteria="abc" onProfileSelect={jest.fn()} />
    );
    expect(screen.getAllByTestId('item')).toHaveLength(2);
  });

  it('shows messages for empty results', () => {
    const { rerender } = render(
      <CommonProfileSearchItems open profiles={[]} selected={null} searchCriteria="ab" onProfileSelect={jest.fn()} />
    );
    expect(screen.getByText('Type at least 3 characters')).toBeInTheDocument();

    rerender(
      <CommonProfileSearchItems open profiles={[]} selected={null} searchCriteria="abcd" onProfileSelect={jest.fn()} />
    );
    expect(screen.getByText('No results')).toBeInTheDocument();
  });

  it('notifies highlighted option id when highlighted option changes', () => {
    const onHighlightedOptionIdChange = jest.fn();
    render(
      <CommonProfileSearchItems
        open
        profiles={profiles}
        selected={null}
        searchCriteria="abc"
        highlightedIndex={1}
        onHighlightedOptionIdChange={onHighlightedOptionIdChange}
        onProfileSelect={jest.fn()}
      />
    );
    expect(onHighlightedOptionIdChange).toHaveBeenCalledWith('profile-search-item-b-1');
  });
});
