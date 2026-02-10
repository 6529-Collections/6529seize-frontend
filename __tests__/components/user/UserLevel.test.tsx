import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UserLevel from '@/components/user/utils/level/UserLevel';

describe('UserLevel', () => {
  it('applies color and size classes', () => {
    const { container } = render(<UserLevel level={50} size="sm" />);
    expect(container.firstChild).toHaveClass('tw-text-[#DAC660]');
    expect(container.firstChild).toHaveClass('tw-text-sm');
  });

  it('opens levels page in new tab when clicked', async () => {
    const open = jest.spyOn(window, 'open').mockImplementation();
    render(<UserLevel level={10} />);
    await userEvent.click(screen.getByRole('button'));
    expect(open).toHaveBeenCalledWith('/network/levels', '_blank');
    open.mockRestore();
  });
});
