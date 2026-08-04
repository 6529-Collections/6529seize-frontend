import { generateDropPart } from '@/components/waves/create-wave/services/waveMediaService';
import { multiPartUpload } from '@/components/waves/create-wave/services/multiPartUpload';

jest.mock('@/components/waves/create-wave/services/multiPartUpload');

const mockFile = (name: string) => new File(['content'], name, { type: 'text/plain' });

describe('generateDropPart', () => {
  it('uploads all media and returns new part', async () => {
    (multiPartUpload as jest.Mock).mockImplementation(({ file }) => Promise.resolve({ url: `url-${file.name}`, mime_type: file.type }));
    const part = { content: 'c', quoted_drop: null, media: [mockFile('a.txt'), mockFile('b.txt')] };
    const result = await generateDropPart(part);
    expect(result.media).toEqual([
      { url: 'url-a.txt', mime_type: 'text/plain' },
      { url: 'url-b.txt', mime_type: 'text/plain' },
    ]);
    expect(result.content).toBe('c');
  });
});
