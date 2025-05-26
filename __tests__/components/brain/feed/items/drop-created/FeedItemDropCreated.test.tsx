import { render } from '@testing-library/react';
import FeedItemDropCreated from '../../../../../../components/brain/feed/items/drop-created/FeedItemDropCreated';

const push = jest.fn();
jest.mock('next/router', () => ({ useRouter: () => ({ push }) }));

let capturedProps: any;
jest.mock('../../../../../../components/waves/drops/Drop', () => ({
  __esModule: true,
  default: (props: any) => {
    capturedProps = props;
    return <div data-testid="drop" />;
  },
  DropLocation: { MY_STREAM: 'MY_STREAM' }
}));

describe('FeedItemDropCreated', () => {
  const item = { item: { wave: { id: '1' }, serial_no: 1 } } as any;

  it('navigates on reply and quote clicks', () => {
    render(
      <FeedItemDropCreated
        item={item}
        showWaveInfo={true}
        activeDrop={null}
        onReply={jest.fn()}
        onQuote={jest.fn()}
      />
    );

    capturedProps.onReplyClick(5);
    expect(push).toHaveBeenCalledWith('/my-stream?wave=1&serialNo=5/');

    capturedProps.onQuoteClick({ wave: { id: '2' }, serial_no: 3 } as any);
    expect(push).toHaveBeenCalledWith('/my-stream?wave=2&serialNo=3/');
  });
});
