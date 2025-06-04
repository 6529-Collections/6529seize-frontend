import { render } from '@testing-library/react';
import { waitFor } from '@testing-library/react';
import InfiniteScrollTrigger from '../../../../components/utils/infinite-scroll/InfiniteScrollTrigger';

const onIntersection = jest.fn();
const useIntersectionMock = jest.fn();

jest.mock('react-use', () => ({
  useIntersection: (...args: any[]) => useIntersectionMock(...args)
}));

beforeEach(() => {
  jest.clearAllMocks();
});

describe('InfiniteScrollTrigger', () => {
  it('calls onIntersection with false when not intersecting', async () => {
    useIntersectionMock.mockReturnValue({ isIntersecting: false });
    render(<InfiniteScrollTrigger onIntersection={onIntersection} />);
    await waitFor(() => {
      expect(onIntersection).toHaveBeenCalledWith(false);
    });
  });

  it('calls onIntersection with true when intersecting', async () => {
    useIntersectionMock.mockReturnValue({ isIntersecting: true });
    render(<InfiniteScrollTrigger onIntersection={onIntersection} />);
    await waitFor(() => {
      expect(onIntersection).toHaveBeenCalledWith(true);
    });
  });
});
