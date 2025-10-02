import { getProfileProxyActionStatus, groupProfileProxies, haveSeenProfileProxyActionAcceptanceModal, setSeenProfileProxyActionAcceptanceModal } from '@/helpers/profile-proxy.helpers';
import { ProfileProxyActionStatus, ProfileProxySide } from '@/entities/IProxy';
import Cookies from 'js-cookie';

jest.mock('js-cookie', () => ({ get: jest.fn(), set: jest.fn() }));

describe('profile-proxy.helpers', () => {
  describe('getProfileProxyActionStatus', () => {
    it('handles granted revoked', () => {
      const status = getProfileProxyActionStatus({ action: { revoked_at: 1 } as any, side: ProfileProxySide.GRANTED });
      expect(status).toBe(ProfileProxyActionStatus.REVOKED);
    });

    it('handles received states', () => {
      expect(getProfileProxyActionStatus({ action: { rejected_at: 1 } as any, side: ProfileProxySide.RECEIVED })).toBe(ProfileProxyActionStatus.REJECTED);
      expect(getProfileProxyActionStatus({ action: { accepted_at: 1 } as any, side: ProfileProxySide.RECEIVED })).toBe(ProfileProxyActionStatus.ACTIVE);
      expect(getProfileProxyActionStatus({ action: {} as any, side: ProfileProxySide.RECEIVED })).toBe(ProfileProxyActionStatus.PENDING);
    });
  });

  describe('groupProfileProxies', () => {
    it('groups proxies by side', () => {
      const proxies: any[] = [
        { id: '1', created_by: { id: 'a' }, granted_to: { id: 'b' }, actions: [{ is_active: true }] },
        { id: '2', created_by: { id: 'c' }, granted_to: { id: 'a' }, actions: [{ is_active: true }] },
      ];
      const grouped = groupProfileProxies({ onlyActive: false, profileProxies: proxies, profileId: 'a' });
      expect(grouped.granted[0].id).toBe('1');
      expect(grouped.received[0].id).toBe('2');
    });
  });

  describe('modal cookie helpers', () => {
    it('checks and sets cookie values', () => {
      (Cookies.get as jest.Mock).mockReturnValueOnce('1');
      expect(haveSeenProfileProxyActionAcceptanceModal({ profileId: 'p' })).toBe(true);
      (Cookies.get as jest.Mock).mockReturnValueOnce(undefined);
      expect(haveSeenProfileProxyActionAcceptanceModal({ profileId: 'p' })).toBe(false);

      setSeenProfileProxyActionAcceptanceModal({ profileId: 'p' });
      expect(Cookies.set).toHaveBeenCalled();
    });
  });
});
