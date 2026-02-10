import { render } from '@testing-library/react';
import CommonInfoBox from '@/components/utils/CommonInfoBox';

describe('CommonInfoBox', () => {
  it('renders message', () => {
    const { getByText } = render(<CommonInfoBox message="hello" />);
    expect(getByText('hello')).toBeInTheDocument();
  });

  it('applies widthFull classes', () => {
    const { container } = render(<CommonInfoBox message="msg" widthFull />);
    const div = container.firstChild as HTMLElement;
    expect(div.className).toContain('tw-w-full');
    expect(div.className).not.toContain('sm:tw-w-auto');
  });
});
