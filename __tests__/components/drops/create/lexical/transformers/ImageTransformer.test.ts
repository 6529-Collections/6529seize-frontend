import { IMAGE_TRANSFORMER } from '../../../../../../components/drops/create/lexical/transformers/ImageTransformer';
import { $createImageNode } from '../../../../../../components/drops/create/lexical/nodes/ImageNode';

jest.mock('../../../../../../components/drops/create/lexical/nodes/ImageNode', () => ({
  $createImageNode: jest.fn((opts) => ({ node: 'image', ...opts })),
  $isImageNode: jest.fn((n) => n && n.type === 'image'),
  ImageNode: class {},
}));

const createImageNode = $createImageNode as jest.Mock;

describe('IMAGE_TRANSFORMER', () => {
  it('exports markdown from image node', () => {
    const node: any = { type: 'image', getSrc: () => 'foo.png' };
    const result = IMAGE_TRANSFORMER.export(node);
    expect(result).toBe('![Seize](foo.png)');
  });

  it('replaces text node with image node on import', () => {
    const textNode = { replace: jest.fn() } as any;
    IMAGE_TRANSFORMER.replace(textNode, ['![Seize](bar.png)', undefined, 'bar.png']);
    expect(createImageNode).toHaveBeenCalledWith({ src: 'bar.png' });
    expect(textNode.replace).toHaveBeenCalledWith({ node: 'image', src: 'bar.png' });
  });
});
