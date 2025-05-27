import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProxyListFilters from '../../../../../../components/user/proxy/list/filters/ProxyListFilters';
import { ProfileProxyListType } from '../../../../../../components/user/proxy/list/ProxyList';

jest.mock('../../../../../../components/utils/select/CommonSelect', () => ({
  __esModule: true,
  default: ({ items, activeItem, setSelected }: any) => (
    <div data-testid="select">
      {items.map((i: any) => (
        <button key={i.key} onClick={() => setSelected(i.value)}>
          {i.label}
        </button>
      ))}
      <span data-testid="active">{activeItem}</span>
    </div>
  ),
}));

describe('ProxyListFilters', () => {
  it('renders options and handles selection', async () => {
    const setSelected = jest.fn();
    render(
      <ProxyListFilters
        selected={ProfileProxyListType.ALL}
        setSelected={setSelected}
      />
    );
    const buttons = screen.getAllByRole('button');
    expect(buttons.map((b) => b.textContent)).toEqual(['All', 'Received', 'Granted']);
    await userEvent.click(screen.getByText('Granted'));
    expect(setSelected).toHaveBeenCalledWith(ProfileProxyListType.GRANTED);
  });
});
