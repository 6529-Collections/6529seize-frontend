import { render, screen } from '@testing-library/react';
import CommonInfiniteScrollWrapper from '@/components/utils/infinite-scroll/CommonInfiniteScrollWrapper';
import userEvent from '@testing-library/user-event';

const Trigger = jest.fn((props: any) => <button onClick={() => props.onIntersection(true)}>trigger</button>);
const Loader = () => <div data-testid="loader" />;

jest.mock('@/components/utils/infinite-scroll/InfiniteScrollTrigger', () => ({ __esModule: true, default: (props: any) => Trigger(props) }));
jest.mock('@/components/distribution-plan-tool/common/CircleLoader', () => ({ __esModule: true, default: () => Loader(), CircleLoaderSize: { MEDIUM: 'MEDIUM' } }));

describe('CommonInfiniteScrollWrapper', () => {
  it('shows loader when loading', () => {
    render(
      <CommonInfiniteScrollWrapper loading={true} onBottomIntersection={jest.fn()}>
        <div>child</div>
      </CommonInfiniteScrollWrapper>
    );
    expect(screen.getByTestId('loader')).toBeInTheDocument();
  });

  it('calls onBottomIntersection when trigger fires', async () => {
    const cb = jest.fn();
    render(
      <CommonInfiniteScrollWrapper loading={false} onBottomIntersection={cb}>
        <div>child</div>
      </CommonInfiniteScrollWrapper>
    );
    await userEvent.click(screen.getByText('trigger'));
    expect(cb).toHaveBeenCalledWith(true);
  });
});
