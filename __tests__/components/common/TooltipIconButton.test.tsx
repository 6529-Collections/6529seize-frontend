import { render, fireEvent } from '@testing-library/react';
import TooltipIconButton from '../../../components/common/TooltipIconButton';
import { faPlus } from '@fortawesome/free-solid-svg-icons';

jest.mock('@fortawesome/react-fontawesome', () => ({ FontAwesomeIcon: (props: any) => <svg data-testid="icon" {...props} /> }));

describe('TooltipIconButton', () => {
  it('shows and hides tooltip on hover', () => {
    const { container, queryByText, getByText } = render(
      <TooltipIconButton icon={faPlus} tooltipText="Hint" />
    );
    const root = container.firstChild as HTMLElement;
    expect(queryByText('Hint')).toBeNull();
    fireEvent.mouseEnter(root);
    const tooltip = getByText('Hint');
    expect(tooltip.className).toContain('tw-bottom-6'); // default top position
    fireEvent.mouseLeave(root);
    expect(queryByText('Hint')).toBeNull();
  });

  it('calls onClick and uses bottom position', () => {
    const onClick = jest.fn();
    const { container, getByText } = render(
      <TooltipIconButton icon={faPlus} tooltipText="Tip" tooltipPosition="bottom" onClick={onClick} />
    );
    const root = container.firstChild as HTMLElement;
    fireEvent.mouseEnter(root);
    const tooltip = getByText('Tip');
    expect(tooltip.className).toContain('tw-top-6');
    fireEvent.click(root);
    expect(onClick).toHaveBeenCalled();
  });
});
