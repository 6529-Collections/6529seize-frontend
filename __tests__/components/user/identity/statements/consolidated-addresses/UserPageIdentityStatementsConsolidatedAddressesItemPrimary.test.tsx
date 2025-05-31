import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Component from '../../../../../../components/user/identity/statements/consolidated-addresses/UserPageIdentityStatementsConsolidatedAddressesItemPrimary';

let loaderRendered = false;
jest.mock('../../../../../../components/distribution-plan-tool/common/CircleLoader', () => () => {
  loaderRendered = true;
  return <div data-testid="loader" />;
});

describe('UserPageIdentityStatementsConsolidatedAddressesItemPrimary', () => {
  const wallet = { wallet: '0xabc' } as any;

  beforeEach(() => {
    loaderRendered = false;
  });

  it('displays Primary label when address is primary', () => {
    render(
      <Component
        isPrimary
        canEdit={false}
        address={wallet}
        assignPrimary={jest.fn()}
        isAssigningPrimary={false}
      />
    );
    expect(screen.getByText('Primary')).toBeInTheDocument();
  });

  it('calls assignPrimary when button clicked', () => {
    const fn = jest.fn();
    render(
      <Component
        isPrimary={false}
        canEdit
        address={wallet}
        assignPrimary={fn}
        isAssigningPrimary={false}
      />
    );
    fireEvent.click(screen.getByRole('button'));
    expect(fn).toHaveBeenCalled();
  });

  it('shows loader when assigning primary', () => {
    render(
      <Component
        isPrimary={false}
        canEdit
        address={wallet}
        assignPrimary={jest.fn()}
        isAssigningPrimary
      />
    );
    expect(loaderRendered).toBe(true);
  });

  it('renders nothing when not editable and not primary', () => {
    const { container } = render(
      <Component
        isPrimary={false}
        canEdit={false}
        address={wallet}
        assignPrimary={jest.fn()}
        isAssigningPrimary={false}
      />
    );
    expect(container.firstChild).toBeNull();
  });
});
