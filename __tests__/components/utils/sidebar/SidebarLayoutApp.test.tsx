import { render, screen } from '@testing-library/react';
import SidebarLayoutApp from '@/components/utils/sidebar/SidebarLayoutApp';

describe('SidebarLayoutApp', () => {
  it('renders children', () => {
    render(
      <SidebarLayoutApp>
        <div data-testid="child">Child Content</div>
      </SidebarLayoutApp>
    );

    expect(screen.getByTestId('child')).toBeInTheDocument();
    expect(screen.getByText('Child Content')).toBeInTheDocument();
  });

  it('renders with correct layout classes', () => {
    const { container } = render(
      <SidebarLayoutApp>
        <div>Content</div>
      </SidebarLayoutApp>
    );

    const main = container.querySelector('main');
    expect(main).toHaveClass('tw-bg-iron-950');
  });
});
