import { render, screen } from '@testing-library/react';
import CommonSelect from '../../../../components/utils/select/CommonSelect';
import { SortDirection } from '../../../../entities/ISort';

let bpValue = 'S';
jest.mock('react-use', () => ({ createBreakpoint: () => () => bpValue }));

jest.mock('../../../../components/utils/select/tabs/CommonTabs', () => ({ __esModule: true, default: () => <div data-testid="tabs" /> }));
jest.mock('../../../../components/utils/select/dropdown/CommonDropdown', () => ({ __esModule: true, default: () => <div data-testid="dropdown" /> }));

describe('CommonSelect', () => {
  const props = {
    items: [{ label: 'A', value: 'a', key: 'a' }],
    activeItem: 'a',
    filterLabel: 'label',
    setSelected: jest.fn()
  };

  it('renders tabs when breakpoint LG', () => {
    bpValue = 'LG';
    render(<CommonSelect {...props} sortDirection={SortDirection.ASC} />);
    expect(screen.getByTestId('tabs')).toBeInTheDocument();
  });

  it('renders dropdown otherwise', () => {
    bpValue = 'S';
    render(<CommonSelect {...props} sortDirection={SortDirection.ASC} />);
    expect(screen.getByTestId('dropdown')).toBeInTheDocument();
  });
});
