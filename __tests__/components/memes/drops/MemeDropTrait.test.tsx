import { render, screen } from '@testing-library/react';
import MemeDropTrait from '@/components/memes/drops/MemeDropTrait';

jest.mock('@/helpers/Helpers', () => ({ formatNumberWithCommas: (n: number) => `f-${n}` }));
jest.mock('@/components/waves/memes/traits/schema', () => ({ FIELD_TO_LABEL_MAP: { pointsLoki: 'Points' } }));
jest.mock('@/hooks/isMobileDevice', () => () => false);

describe('MemeDropTrait', () => {
  it('converts boolean values', () => {
    render(<MemeDropTrait label="flag" value="true" />);
    expect(screen.getByText('Yes')).toBeInTheDocument();
  });

  it('formats numeric values', () => {
    render(<MemeDropTrait label="num" value="1234" />);
    expect(screen.getByText('f-1234')).toBeInTheDocument();
  });

  it('shows raw text for others', () => {
    render(<MemeDropTrait label="text" value="hello" />);
    expect(screen.getByText('hello')).toBeInTheDocument();
  });
});
