import { render, screen, fireEvent } from '@testing-library/react';
import TooltipIconButton from '../../../components/common/TooltipIconButton';
import { faCheck } from '@fortawesome/free-solid-svg-icons';

jest.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: (props: any) => <svg data-testid="icon" {...props} />,
}));

describe('TooltipIconButton', () => {
  it('shows tooltip on hover and hides on mouse leave', () => {
    render(<TooltipIconButton icon={faCheck} tooltipText="info" />);
    const wrapper = screen.getByTestId('icon').parentElement as HTMLElement;
    expect(screen.queryByText('info')).not.toBeInTheDocument();

    fireEvent.mouseEnter(wrapper);
    const tooltip = screen.getByText('info');
    expect(tooltip).toBeInTheDocument();
    expect(tooltip.className).toContain('tw-bottom-6');

    fireEvent.mouseLeave(wrapper);
    expect(screen.queryByText('info')).not.toBeInTheDocument();
  });

  it('applies bottom position classes', () => {
    render(
      <TooltipIconButton icon={faCheck} tooltipText="info" tooltipPosition="bottom" />
    );
    const wrapper = screen.getByTestId('icon').parentElement as HTMLElement;
    fireEvent.mouseEnter(wrapper);
    const tooltip = screen.getByText('info');
    expect(tooltip.className).toContain('tw-top-6');
  });

  it('calls onClick and stops propagation', () => {
    const onClick = jest.fn();
    const parentClick = jest.fn();
    render(
      <div onClick={parentClick}>
        <TooltipIconButton icon={faCheck} tooltipText="info" onClick={onClick} />
      </div>
    );
    const wrapper = screen.getByTestId('icon').parentElement as HTMLElement;
    fireEvent.click(wrapper);
    expect(onClick).toHaveBeenCalled();
    expect(parentClick).not.toHaveBeenCalled();
  });
});
