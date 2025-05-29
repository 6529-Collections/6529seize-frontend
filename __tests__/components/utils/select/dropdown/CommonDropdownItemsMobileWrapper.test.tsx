import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import CommonDropdownItemsMobileWrapper from '../../../../../components/utils/select/dropdown/CommonDropdownItemsMobileWrapper';

jest.mock('@headlessui/react', () => {
  const Comp = (p: any) => <div {...p}>{p.children}</div>;
  return {
    Dialog: Object.assign(Comp, { Panel: Comp, Title: Comp }),
    Transition: { Root: ({ show, children }: any) => (show ? <div data-testid="root">{children}</div> : null), Child: Comp },
  };
});

describe('CommonDropdownItemsMobileWrapper', () => {
  it('renders when open and closes on button click', () => {
    const setOpen = jest.fn();
    render(
      <CommonDropdownItemsMobileWrapper isOpen={true} setOpen={setOpen} label="test">
        <li>child</li>
      </CommonDropdownItemsMobileWrapper>
    );
    expect(screen.getByText('test')).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Close panel'));
    expect(setOpen).toHaveBeenCalledWith(false);
  });
});
