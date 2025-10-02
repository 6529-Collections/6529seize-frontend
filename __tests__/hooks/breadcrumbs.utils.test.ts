import { formatCrumbDisplay, getDynamicParam, buildStaticCrumbs } from '@/hooks/breadcrumbs.utils';

describe('breadcrumbs utils', () => {
  describe('formatCrumbDisplay', () => {
    it('capitalizes and splits hyphenated segments', () => {
      expect(formatCrumbDisplay('foo-bar-baz')).toBe('Foo Bar Baz');
    });

    it('returns empty string for empty segment', () => {
      expect(formatCrumbDisplay('')).toBe('');
    });
  });

  describe('getDynamicParam', () => {
    const segments = ['drops', '123', 'edit'];
    it('returns segment based on base and offset', () => {
      expect(getDynamicParam(segments, 'drops')).toBe('123');
      expect(getDynamicParam(segments, 'drops', 2)).toBe('edit');
    });

    it('returns query param when provided', () => {
      expect(getDynamicParam(segments, 'drops', 1, '999')).toBe('999');
      expect(getDynamicParam(segments, 'drops', 1, ['888'])).toBe('888');
    });

    it('returns undefined when base not found or out of range', () => {
      expect(getDynamicParam(segments, 'missing')).toBeUndefined();
      expect(getDynamicParam(segments, 'edit', 1)).toBeUndefined();
    });
  });

  describe('buildStaticCrumbs', () => {
    it('creates crumbs with hrefs except last segment', () => {
      const result = buildStaticCrumbs(['drops', '123', 'edit']);
      expect(result).toEqual([
        { display: 'Drops', href: '/drops' },
        { display: '123', href: '/drops/123' },
        { display: 'Edit' }
      ]);
    });
  });
});
