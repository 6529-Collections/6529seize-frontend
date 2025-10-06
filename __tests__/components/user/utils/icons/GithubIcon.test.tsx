import { render } from '@testing-library/react';
import GithubIcon from '@/components/user/utils/icons/GithubIcon';

describe('GithubIcon', () => {
  it('renders svg element', () => {
    const { container } = render(<GithubIcon />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    const ellipse = container.querySelector('ellipse');
    expect(ellipse).toBeInTheDocument();
  });
});
