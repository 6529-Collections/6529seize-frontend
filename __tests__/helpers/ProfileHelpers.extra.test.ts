import { getProfileConnectedStatus, profileAndConsolidationsToProfileMin } from '@/helpers/ProfileHelpers';
import { ProfileConnectedStatus } from '@/entities/IProfile';

describe('getProfileConnectedStatus', () => {
  it('returns NOT_CONNECTED when profile missing', () => {
    expect(getProfileConnectedStatus({ profile: null, isProxy: false })).toBe(ProfileConnectedStatus.NOT_CONNECTED);
  });

  it('returns PROXY when isProxy true', () => {
    expect(getProfileConnectedStatus({ profile: {} as any, isProxy: true })).toBe(ProfileConnectedStatus.PROXY);
  });

  it('returns NO_PROFILE when handle missing', () => {
    const profile = { handle: null } as any;
    expect(getProfileConnectedStatus({ profile, isProxy: false })).toBe(ProfileConnectedStatus.NO_PROFILE);
  });

  it('returns HAVE_PROFILE otherwise', () => {
    const profile = { handle: 'user' } as any;
    expect(getProfileConnectedStatus({ profile, isProxy: false })).toBe(ProfileConnectedStatus.HAVE_PROFILE);
  });
});

describe('profileAndConsolidationsToProfileMin', () => {
  it('returns null when id or handle missing', () => {
    expect(profileAndConsolidationsToProfileMin({ profile: { id: '', handle: '' } as any })).toBeNull();
  });

  it('maps fields correctly', () => {
    const profile = {
      id: '1',
      handle: 'user',
      pfp: 'img',
      banner1: 'b1',
      banner2: 'b2',
      cic: 1,
      rep: 2,
      tdh: 3,
      level: 4,
      primary_wallet: '0x1'
    } as any;
    const res = profileAndConsolidationsToProfileMin({ profile })!;
    expect(res).toEqual({
      id: '1',
      handle: 'user',
      pfp: 'img',
      banner1_color: 'b1',
      banner2_color: 'b2',
      cic: 1,
      rep: 2,
      tdh: 3,
      level: 4,
      archived: false,
      primary_address: '0x1',
      active_main_stage_submission_ids: undefined,
      winner_main_stage_drop_ids: []
    });
  });
});
