import { isCollectionAdmin, isCollectionArtist } from '../../../components/nextGen/nextgen_helpers';
import { areEqualAddresses } from '../../../helpers/Helpers';

jest.mock('../../../helpers/Helpers', () => ({ areEqualAddresses: jest.fn(() => true) }));

describe('nextgen_helpers additional2', () => {
  it('detects collection admin', () => {
    const admin = { data: [{ result: false }, { result: true }] } as any;
    expect(isCollectionAdmin(admin)).toBe(true);
    expect(isCollectionAdmin({ data: [{ result: false }] })).toBe(false);
  });

  it('checks collection artist address', () => {
    const artists = { data: [{ result: '0x1' }, { result: '0x2' }] } as any;
    expect(isCollectionArtist('0x2', artists)).toBe(true);
    (areEqualAddresses as jest.Mock).mockReturnValue(false);
    expect(isCollectionArtist('0x3', artists)).toBe(false);
  });
});
