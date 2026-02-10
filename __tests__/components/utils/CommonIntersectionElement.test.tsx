import { render } from '@testing-library/react';
import CommonIntersectionElement from '@/components/utils/CommonIntersectionElement';

const useIntersection = jest.fn();
jest.mock('react-use', () => ({
  useIntersection: (...args: any[]) => useIntersection(...args)
}));

describe('CommonIntersectionElement', () => {
  it('calls onIntersection with intersection state', () => {
    const cb = jest.fn();
    useIntersection.mockReturnValue({ isIntersecting: true });
    render(<CommonIntersectionElement onIntersection={cb} />);
    expect(cb).toHaveBeenCalledWith(true);
  });

  it('handles missing intersection', () => {
    const cb = jest.fn();
    useIntersection.mockReturnValue({ isIntersecting: false });
    render(<CommonIntersectionElement onIntersection={cb} />);
    expect(cb).toHaveBeenCalledWith(false);
  });
});

