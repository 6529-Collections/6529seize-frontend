import { render, screen, fireEvent } from '@testing-library/react';
import DatePickerModal from '../../../components/datePickerModal/DatePickerModal';

jest.mock('react-bootstrap', () => {
  const RB: any = {
    // eslint-disable-next-line react/display-name
    Modal: ({ children }: any) => <div data-testid="modal">{children}</div>,
    // eslint-disable-next-line react/display-name
    Container: (p: any) => <div {...p} />,
    // eslint-disable-next-line react/display-name
    Row: (p: any) => <div {...p} />,
    // eslint-disable-next-line react/display-name
    Col: (p: any) => <div {...p} />,
    // eslint-disable-next-line react/display-name
    Button: (p: any) => <button {...p} />,
  };
  // eslint-disable-next-line react/display-name
  RB.Modal.Header = (p: any) => <div {...p} />;
  // eslint-disable-next-line react/display-name
  RB.Modal.Title = (p: any) => <div {...p} />;
  // eslint-disable-next-line react/display-name
  RB.Modal.Body = (p: any) => <div {...p} />;
  // eslint-disable-next-line react/display-name
  RB.Modal.Footer = (p: any) => <div {...p} />;
  // eslint-disable-next-line react/display-name
  const Form: any = (p: any) => <form {...p} />;
  // eslint-disable-next-line react/display-name
  Form.Group = (p: any) => <div {...p} />;
  // eslint-disable-next-line react/display-name
  Form.Label = (p: any) => <label {...p} />;
  // eslint-disable-next-line react/display-name
  Form.Control = (p: any) => <input {...p} />;
  RB.Form = Form;
  return RB;
});

jest.mock('@fortawesome/react-fontawesome', () => ({ FontAwesomeIcon: (p: any) => <svg data-testid="fa" onClick={p.onClick} /> }));

describe('DatePickerModal', () => {
  it('prefills date inputs with initial values', () => {
    const from = new Date('2022-01-01');
    const to = new Date('2022-01-02');
    render(
      <DatePickerModal
        mode="date"
        show
        initial_from_date={from}
        initial_to_date={to}
        onHide={jest.fn()}
      />
    );
    const start = screen.getByPlaceholderText('Start Date') as HTMLInputElement;
    const end = screen.getByPlaceholderText('End Date') as HTMLInputElement;
    expect(start).toHaveValue('2022-01-01');
    expect(end).toHaveValue('2022-01-02');
  });

  it('shows error when start date is after end date', () => {
    render(
      <DatePickerModal mode="date" show onHide={jest.fn()} />
    );
    const start = screen.getByPlaceholderText('Start Date');
    const end = screen.getByPlaceholderText('End Date');
    fireEvent.change(start, { target: { value: '2024-01-02' } });
    fireEvent.change(end, { target: { value: '2024-01-01' } });
    fireEvent.click(screen.getByText('Apply'));
    expect(screen.getByText('The start date must be before the end date.')).toBeInTheDocument();
  });

  it('shows error for invalid block numbers', () => {
    render(
      <DatePickerModal mode="block" show onHide={jest.fn()} />
    );
    const start = screen.getByPlaceholderText('Start Block');
    const end = screen.getByPlaceholderText('End Block');
    fireEvent.change(start, { target: { value: 'abc' } });
    fireEvent.change(end, { target: { value: '10' } });
    fireEvent.click(screen.getByText('Apply'));
    expect(screen.getByText('Please enter a valid start and end block.')).toBeInTheDocument();
  });

  it('applies valid block numbers', () => {
    const onApply = jest.fn();
    const onHide = jest.fn();
    render(
      <DatePickerModal mode="block" show onApplyBlock={onApply} onHide={onHide} />
    );
    const start = screen.getByPlaceholderText('Start Block');
    const end = screen.getByPlaceholderText('End Block');
    fireEvent.change(start, { target: { value: '1' } });
    fireEvent.change(end, { target: { value: '2' } });
    fireEvent.click(screen.getByText('Apply'));
    expect(onApply).toHaveBeenCalledWith(1, 2);
    expect(onHide).toHaveBeenCalled();
  });
});
