import { render, screen } from '@testing-library/react';
import EmmaListSearchItemsContent from '@/components/utils/input/emma/EmmaListSearchItemsContent';

jest.mock('@/components/utils/input/emma/EmmaListSearchItem', () => (props: any) => (
  <div data-testid="item" data-selected={props.selectedId === props.item.id} onClick={() => props.onSelect(props.item)} />
));

const items: any[] = [
  { id: '1', name: 'A', description: 'desc', walletsCount: 1, poolType: 0 },
  { id: '2', name: 'B', description: 'desc', walletsCount: 2, poolType: 0 },
];

describe('EmmaListSearchItemsContent', () => {
  it('shows loading', () => {
    render(
      <EmmaListSearchItemsContent selectedId={null} loading={true} items={[]} onSelect={jest.fn()} />
    );
    expect(screen.getByText('Loading...', { selector: 'li' })).toBeInTheDocument();
  });

  it('renders items and passes props', () => {
    const onSelect = jest.fn();
    render(
      <EmmaListSearchItemsContent selectedId="2" loading={false} items={items} onSelect={onSelect} />
    );
    const rendered = screen.getAllByTestId('item');
    expect(rendered).toHaveLength(2);
    expect(rendered[1]).toHaveAttribute('data-selected', 'true');
  });

  it('renders no results', () => {
    render(
      <EmmaListSearchItemsContent selectedId={null} loading={false} items={[]} onSelect={jest.fn()} />
    );
    expect(screen.getByText('No results')).toBeInTheDocument();
  });
});
