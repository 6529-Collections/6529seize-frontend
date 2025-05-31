import { render, screen, fireEvent, act } from '@testing-library/react';
import React from 'react';
import CommonDropdownItem from '../../../../../components/utils/select/dropdown/CommonDropdownItem';
import { SortDirection } from '../../../../../entities/ISort';

jest.useFakeTimers();

jest.mock('../../../../../components/user/utils/icons/CommonTableSortIcon', () => (props: any) => (
  <div data-testid="sort">{props.direction}</div>
));

test('calls setSelected on click', () => {
  const setSelected = jest.fn();
  const item = { label: 'Item', value: 'v', key: 'k' };
  render(<CommonDropdownItem item={item} activeItem="" setSelected={setSelected} isMobile={false} />);
  fireEvent.click(screen.getByRole('button'));
  expect(setSelected).toHaveBeenCalledWith('v');
});

test('shows check icon when active', () => {
  const item = { label: 'Item', value: 'v', key: 'k' };
  render(<CommonDropdownItem item={item} activeItem="v" setSelected={jest.fn()} isMobile={false} sortDirection={SortDirection.ASC} />);
  expect(screen.getByTestId('sort')).toBeInTheDocument();
  expect(screen.getByTestId('sort')).toHaveTextContent('ASC');
  expect(screen.getByRole('button').querySelector('svg')).toBeInTheDocument();
});

test('handles copy feedback', () => {
  const item = { label: 'Copy', value: 'c', key: 'k' };
  const Child = ({ onCopy }: { onCopy: () => void }) => <button data-testid="child" onClick={onCopy} />;
  render(
    <CommonDropdownItem item={item} activeItem="" setSelected={jest.fn()} isMobile={false}>
      <Child />
    </CommonDropdownItem>
  );
  fireEvent.click(screen.getByTestId('child'));
  expect(screen.getByText('Copied!')).toBeInTheDocument();
  act(() => { jest.advanceTimersByTime(1000); });
  expect(screen.getByText('Copy')).toBeInTheDocument();
});
