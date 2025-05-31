import { getServerSideProps } from '../../pages/my-stream/notifications';
import { prefetchAuthenticatedNotifications } from '../../helpers/stream.helpers';
import { QueryKey } from '../../components/react-query-wrapper/ReactQueryWrapper';
import { Time } from '../../helpers/time';

jest.mock('../../helpers/stream.helpers', () => ({
  prefetchAuthenticatedNotifications: jest.fn(),
}));

describe('my-stream notifications getServerSideProps', () => {
  const spy = jest.spyOn(Time, 'now');

  afterEach(() => {
    (prefetchAuthenticatedNotifications as jest.Mock).mockClear();
    spy.mockReset();
  });

  it('prefetches when cookie timestamp is old', async () => {
    spy.mockReturnValue(Time.millis(200000));
    const context: any = { req: { cookies: { [QueryKey.IDENTITY_NOTIFICATIONS]: '100000' } } };
    await getServerSideProps(context);
    expect(prefetchAuthenticatedNotifications).toHaveBeenCalled();
  });

  it('does not prefetch when cookie is fresh', async () => {
    spy.mockReturnValue(Time.millis(200000));
    const context: any = { req: { cookies: { [QueryKey.IDENTITY_NOTIFICATIONS]: '199999' } } };
    await getServerSideProps(context);
    expect(prefetchAuthenticatedNotifications).not.toHaveBeenCalled();
  });
});
