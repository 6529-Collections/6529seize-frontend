import { render, fireEvent } from '@testing-library/react';
import {
  DelegationExpiryCalendar,
  DelegationTokenSelection,
  DelegationCloseButton,
} from '../../../components/delegation/DelegationFormParts';

jest.mock('react-bootstrap', () => ({
  __esModule: true,
  Container: (p:any)=> <div {...p} />,
  Row: (p:any)=> <div {...p} />,
  Col: (p:any)=> <div {...p} />,
  Form: { Control: (p:any)=> <input {...p}/> },
}));

jest.mock('@fortawesome/react-fontawesome', () => ({ FontAwesomeIcon: (p:any)=> <svg data-testid="icon" onClick={p.onClick} {...p}/> }));

jest.mock('@tippyjs/react', () => (props:any) => <div data-testid="tippy" {...props}>{props.children}</div>);

describe('Delegation form helpers', () => {
  it('DelegationExpiryCalendar sets date correctly', () => {
    const setDate = jest.fn();
    const { container } = render(<DelegationExpiryCalendar setDelegationDate={setDate} />);
    const input = container.querySelector('input') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '2024-01-02' } });
    expect(setDate).toHaveBeenCalledWith(new Date('2024-01-02'));
    fireEvent.change(input, { target: { value: '' } });
    expect(setDate).toHaveBeenLastCalledWith(undefined);
  });

  it('DelegationTokenSelection handles numeric input', () => {
    const setToken = jest.fn();
    const { container } = render(<DelegationTokenSelection setDelegationToken={setToken} />);
    const input = container.querySelector('input') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '5' } });
    expect(setToken).toHaveBeenCalledWith(5);
    fireEvent.change(input, { target: { value: 'abc' } });
    expect(isNaN(setToken.mock.calls[1][0])).toBe(true);
  });

  it('DelegationCloseButton triggers onHide', () => {
    const onHide = jest.fn();
    const { getByLabelText } = render(<DelegationCloseButton title="Test" onHide={onHide} />);
    fireEvent.click(getByLabelText('Cancel Test'));
    expect(onHide).toHaveBeenCalled();
  });
});
