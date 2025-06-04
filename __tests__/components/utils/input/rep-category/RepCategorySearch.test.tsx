import React from 'react';
import { render, fireEvent, act } from '@testing-library/react';
import RepCategorySearch from '../../../../../components/utils/input/rep-category/RepCategorySearch';
import { useQuery } from '@tanstack/react-query';

jest.mock('@tanstack/react-query');
jest.mock('../../../../../components/utils/input/rep-category/RepCategorySearchDropdown', () => (props: any) => {
  dropdownProps = props;
  return <div data-testid="dropdown" />;
});

jest.mock('react-use', () => ({
  useDebounce: jest.fn((fn: Function, delay: number, deps: any[]) => {
    React.useEffect(() => {
      fn();
    }, deps);
  }),
  useClickAway: jest.fn(),
  useKeyPressEvent: jest.fn()
}));

let dropdownProps: any = null;

(useQuery as jest.Mock).mockReturnValue({ data: ['Art'] });

describe('RepCategorySearch', () => {
  it('passes categories to dropdown', () => {
    const setCategory = jest.fn();
    jest.useFakeTimers();
    const { getByRole } = render(
      <RepCategorySearch category={null} setCategory={setCategory} />
    );
    fireEvent.change(getByRole('textbox'), { target: { value: 'art' } });
    act(() => { jest.runAllTimers(); });
    expect(dropdownProps.categories).toEqual(['art', 'Art']);
  });
});
