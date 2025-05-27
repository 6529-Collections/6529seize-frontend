import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GroupCreateNftSearchItems from '../../../../../../../components/groups/page/create/config/nfts/GroupCreateNftSearchItems';
import { useQuery } from '@tanstack/react-query';

jest.mock('@tanstack/react-query');

jest.mock('../../../../../../../components/groups/page/create/config/nfts/GroupCreateNftSearchItemsContent', () => ({
  __esModule: true,
  default: (props: any) => (
    <div data-testid="content">
      {props.loading ? 'loading' : 'loaded'}-{props.items.length}
      <button onClick={() => props.onSelect({ id: '1', contract: '0x' })}>select</button>
    </div>
  )
}));

const mockUseQuery = useQuery as jest.Mock;

function renderComponent(props: Partial<{open: boolean; searchCriteria: string | null; selected: any[]; onSelect: any}> = {}) {
  const defaultProps = { open: true, searchCriteria: null, selected: [], onSelect: jest.fn() };
  return { onSelect: defaultProps.onSelect, ...render(<GroupCreateNftSearchItems {...{ ...defaultProps, ...props }} />) };
}

describe('GroupCreateNftSearchItems', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseQuery.mockReturnValue({ isFetching: false, data: [] });
  });

  it('does not render dropdown when open is false', () => {
    renderComponent({ open: false });
    expect(screen.queryByTestId('content')).toBeNull();
    // query is still invoked but component remains hidden
    expect(mockUseQuery).toHaveBeenCalled();
  });

  it('calls useQuery with disabled state when search criteria is short', () => {
    renderComponent({ searchCriteria: 'ab' });
    expect(mockUseQuery).toHaveBeenCalledWith(expect.objectContaining({
      queryKey: expect.any(Array),
      queryFn: expect.any(Function),
      enabled: false
    }));
  });

  it('fetches items when criteria length sufficient and passes selection', async () => {
    const onSelect = jest.fn();
    const user = userEvent.setup();
    mockUseQuery.mockReturnValue({ isFetching: false, data: [{ id: '1', contract: '0x' }] });
    renderComponent({ searchCriteria: 'abcd', onSelect });
    await user.click(screen.getByRole('button'));
    expect(onSelect).toHaveBeenCalledWith({ id: '1', contract: '0x' });
    expect(mockUseQuery).toHaveBeenCalledWith(expect.objectContaining({ enabled: true }));
  });
});
