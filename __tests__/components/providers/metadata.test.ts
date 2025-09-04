import { getAppMetadata, getPageMetadata } from '@/components/providers/metadata';

describe('Metadata functionality (migrated from _document.tsx)', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset environment variables before each test
    process.env = { ...originalEnv };
    delete process.env.VERSION;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('Version Meta Tag (core functionality from _document.tsx)', () => {
    it('includes version meta tag in other field when VERSION env var is set', () => {
      process.env.VERSION = 'test-version-123';
      
      const metadata = getAppMetadata();
      
      expect(metadata.other).toEqual({
        version: 'test-version-123'
      });
    });

    it('includes empty version when VERSION env var is not set', () => {
      const metadata = getAppMetadata();
      
      expect(metadata.other).toEqual({
        version: ''
      });
    });

    it('maintains version meta tag functionality that was in the old _document.tsx test', () => {
      // This replicates the core functionality that was tested in the old document.test.tsx
      process.env.VERSION = 'test-version';
      const metadata = getAppMetadata();
      
      // In the old _document.tsx, this would be: <meta name="version" content="test-version" />
      // In the new App Router, this becomes metadata.other.version
      expect(metadata.other?.version).toBe('test-version');
    });
  });

  describe('Standard Metadata Structure', () => {
    it('includes favicon icon', () => {
      const metadata = getAppMetadata();
      expect(metadata.icons).toEqual({
        icon: '/favicon.ico'
      });
    });

    it('includes open graph metadata with proper structure', () => {
      const metadata = getAppMetadata();
      
      expect(metadata.openGraph).toBeDefined();
      expect(metadata.openGraph?.images).toBeInstanceOf(Array);
      expect(metadata.openGraph?.images.length).toBeGreaterThan(0);
      expect(metadata.openGraph?.title).toBeDefined();
      expect(metadata.openGraph?.description).toBeDefined();
    });

    it('includes twitter card metadata', () => {
      const metadata = getAppMetadata();
      
      expect(metadata.twitter).toEqual({
        card: 'summary'
      });
    });

    it('accepts custom metadata overrides', () => {
      const customMetadata = {
        title: 'Custom Title',
        description: 'Custom Description',
        ogImage: 'https://custom.com/image.png',
        twitterCard: 'summary_large_image' as const
      };
      
      const metadata = getAppMetadata(customMetadata);
      
      expect(metadata.title).toBe('Custom Title');
      expect(metadata.openGraph?.images).toEqual(['https://custom.com/image.png']);
      expect(metadata.twitter?.card).toBe('summary_large_image');
    });
  });

  describe('Page Metadata Functionality', () => {
    it('merges component and page metadata correctly', () => {
      const componentMetadata = {
        title: 'Component Title',
        description: 'Component Description'
      };
      
      const pageMetadata = {
        ogImage: 'https://page.com/image.png',
        twitterCard: 'summary_large_image' as const
      };
      
      const result = getPageMetadata({ componentMetadata, pageMetadata });
      
      expect(result.title).toBe('Component Title');
      expect(result.ogImage).toBe('https://page.com/image.png');
      expect(result.twitterCard).toBe('summary_large_image');
      expect(typeof result.description).toBe('string');
      expect(result.description.includes('Component Description')).toBe(true);
    });

    it('uses default values when no metadata provided', () => {
      const result = getPageMetadata({});
      
      expect(result.title).toBeDefined();
      expect(result.description).toBeDefined();
      expect(result.ogImage).toBeDefined();
      expect(result.twitterCard).toBe('summary');
    });

    it('prioritizes component metadata over page metadata', () => {
      const componentMetadata = {
        title: 'Component Title'
      };
      
      const pageMetadata = {
        title: 'Page Title'
      };
      
      const result = getPageMetadata({ componentMetadata, pageMetadata });
      
      expect(result.title).toBe('Component Title');
    });

    it('handles undefined values gracefully', () => {
      const result = getPageMetadata({
        componentMetadata: {
          title: undefined,
          description: undefined,
          ogImage: undefined,
          twitterCard: undefined
        }
      });
      
      expect(result.title).toBeDefined();
      expect(result.description).toBeDefined();
      expect(result.ogImage).toBeDefined();
      expect(result.twitterCard).toBe('summary');
    });
  });
});
