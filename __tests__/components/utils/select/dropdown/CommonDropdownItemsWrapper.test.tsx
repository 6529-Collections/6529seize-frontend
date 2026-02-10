import { render, screen } from '@testing-library/react';
import React from 'react';
import CommonDropdownItemsWrapper from '@/components/utils/select/dropdown/CommonDropdownItemsWrapper';

let bp = 'LG';
jest.mock('react-use', () => ({ createBreakpoint: () => () => bp }));

jest.mock('@/components/utils/select/dropdown/CommonDropdownItemsMobileWrapper', () => ({
  __esModule: true,
  default: (props: any) => <div data-testid="mobile">{props.children}</div>
}));

jest.mock('@/components/utils/select/dropdown/CommonDropdownItemsDefaultWrapper', () => ({
  __esModule: true,
  default: (props: any) => <div data-testid="default">{props.children}</div>
}));

const buttonRef = { current: null } as any;

describe('CommonDropdownItemsWrapper', () => {
  it('renders default wrapper on large screens', () => {
    const onMobile = jest.fn();
    render(
      <CommonDropdownItemsWrapper
        isOpen={true}
        filterLabel="label"
        buttonRef={buttonRef}
        setOpen={jest.fn()}
        onIsMobile={onMobile}
      >
        <li>child</li>
      </CommonDropdownItemsWrapper>
    );
    expect(screen.getByTestId('default')).toBeInTheDocument();
    expect(screen.getByText('child')).toBeInTheDocument();
    expect(onMobile).toHaveBeenCalledWith(false);
  });

  it('renders mobile wrapper on small screens', () => {
    bp = 'S';
    const onMobile = jest.fn();
    render(
      <CommonDropdownItemsWrapper
        isOpen={true}
        filterLabel="label"
        buttonRef={buttonRef}
        setOpen={jest.fn()}
        onIsMobile={onMobile}
      >
        <li>child</li>
      </CommonDropdownItemsWrapper>
    );
    expect(screen.getByTestId('mobile')).toBeInTheDocument();
    expect(onMobile).toHaveBeenCalledWith(true);
  });
});
