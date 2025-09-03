import { generateMetadata } from '@/app/[user]/collected/page';
import { getAppCommonHeaders } from '@/helpers/server.app.helpers';
import { getUserProfile } from '@/helpers/server.helpers';
import { getMetadataForUserPage } from '@/helpers/Helpers';
import { getAppMetadata } from '@/components/providers/metadata';

jest.mock('@/helpers/server.app.helpers');
jest.mock('@/helpers/server.helpers');
jest.mock('@/helpers/Helpers');
jest.mock('@/components/providers/metadata');

describe('user collected generateMetadata', () => {
  it('returns metadata for collected page', async () => {
    (getAppCommonHeaders as jest.Mock).mockResolvedValue({ h: '1' });
    const profile = { handle: 'alice' } as any;
    (getUserProfile as jest.Mock).mockResolvedValue(profile);
    (getMetadataForUserPage as jest.Mock).mockReturnValue({ title: 't' });
    (getAppMetadata as jest.Mock).mockReturnValue({ title: 't' });

    const meta = await generateMetadata({ params: Promise.resolve({ user: 'alice' }) });

    expect(getAppCommonHeaders).toHaveBeenCalled();
    expect(getUserProfile).toHaveBeenCalledWith({ user: 'alice', headers: { h: '1' } });
    expect(getMetadataForUserPage).toHaveBeenCalledWith(profile, 'Collected');
    expect(getAppMetadata).toHaveBeenCalledWith({ title: 't' });
    expect(meta).toEqual({ title: 't' });
  });
});
