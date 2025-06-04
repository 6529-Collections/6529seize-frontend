import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GroupCreateNftSearch from '../../../../../../../components/groups/page/create/config/nfts/GroupCreateNftSearch';

let capturedProps: any = null;
let clickAwayCb: () => void = () => {};
let keyPressCb: () => void = () => {};

jest.mock('../../../../../../../components/groups/page/create/config/nfts/GroupCreateNftSearchItems', () => ({
  __esModule: true,
  default: (props: any) => { capturedProps = props; return <div data-testid="items" />; }
}));

jest.mock('react-use', () => ({
  useClickAway: (_ref: any, cb: () => void) => { clickAwayCb = cb; },
  useKeyPressEvent: (_key: string, cb: () => void) => { keyPressCb = cb; },
}));

function renderComponent(selected: any[] = [], onSelect = jest.fn()) {
  return render(<GroupCreateNftSearch selected={selected} onSelect={onSelect} />);
}

const sampleItem = { id: '1', contract: '0xabc', name: 'NFT', image_url: 'img' } as any;

describe('GroupCreateNftSearch', () => {
  beforeEach(() => {
    capturedProps = null;
  });

  it('opens on focus and closes via click away', async () => {
    const user = userEvent.setup();
    renderComponent();
    const input = screen.getByRole('textbox');

    expect(capturedProps.open).toBe(false);
    await user.click(input);
    expect(capturedProps.open).toBe(true);

    act(() => {
      clickAwayCb();
    });
    expect(capturedProps.open).toBe(false);
  });

  it('updates search criteria and handles external close events', async () => {
    const user = userEvent.setup();
    renderComponent();
    const input = screen.getByRole('textbox');
    await user.type(input, 'abc');
    expect(capturedProps.searchCriteria).toBe('abc');

    act(() => {
      clickAwayCb();
    });
    expect(capturedProps.open).toBe(false);

    await user.click(input);
    act(() => {
      keyPressCb();
    });
    expect(capturedProps.open).toBe(false);
  });

  it('resets search criteria and propagates selection', async () => {
    const onSelect = jest.fn();
    renderComponent([], onSelect);
    const input = screen.getByRole('textbox');
    await userEvent.type(input, '123');

    act(() => {
      capturedProps.onSelect(sampleItem);
    });

    expect(onSelect).toHaveBeenCalledWith(sampleItem);
    expect(capturedProps.searchCriteria).toBe(null);
    expect(capturedProps.open).toBe(false);
  });
});
