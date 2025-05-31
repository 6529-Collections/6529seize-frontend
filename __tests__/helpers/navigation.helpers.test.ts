import { mainSegment, sameMainPath } from '../../helpers/navigation.helpers';

describe('navigation.helpers', () => {
  describe('mainSegment', () => {
    it('returns lowercase first path segment', () => {
      expect(mainSegment('/Foo/Bar')).toBe('/foo');
    });

    it('ignores query and hash', () => {
      expect(mainSegment('/TEST/path?x=1#hash')).toBe('/test');
    });

    it('returns root for empty path', () => {
      expect(mainSegment('/')).toBe('/');
      expect(mainSegment('')).toBe('/');
    });
  });

  describe('sameMainPath', () => {
    it('compares main segments case-insensitively', () => {
      expect(sameMainPath('/Foo/a', '/foo/b')).toBe(true);
    });

    it('detects different segments', () => {
      expect(sameMainPath('/one', '/two')).toBe(false);
    });
  });
});
