import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CommonBorderedRadioButton from '../../../../components/utils/radio/CommonBorderedRadioButton';


describe('CommonBorderedRadioButton', () => {
  it('calls onChange when clicked if not disabled', async () => {
    const onChange = jest.fn();
    const user = userEvent.setup();
    render(
      <CommonBorderedRadioButton
        type="A"
        selected="B"
        label="Option A"
        onChange={onChange}
      />
    );
    await user.click(screen.getByRole('radio'));
    expect(onChange).toHaveBeenCalledWith('A');
  });

  it('does not call onChange when disabled', async () => {
    const onChange = jest.fn();
    const user = userEvent.setup();
    render(
      <CommonBorderedRadioButton
        type="A"
        selected="B"
        label="Option A"
        onChange={onChange}
        disabled
      />
    );
    await user.click(screen.getByRole('radio'));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('renders children when label not provided', () => {
    render(
      <CommonBorderedRadioButton type="A" selected="A" onChange={() => {}}>
        <span data-testid="child" />
      </CommonBorderedRadioButton>
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
    expect(screen.getByRole('radio')).toBeChecked();
  });
});
