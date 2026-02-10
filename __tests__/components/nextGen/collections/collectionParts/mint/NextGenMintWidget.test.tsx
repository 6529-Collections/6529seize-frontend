import { render } from '@testing-library/react';
import { getJsonData } from '@/components/nextGen/collections/collectionParts/mint/NextGenMintWidget';

describe('getJsonData', () => {
  it('parses json and capitalizes keys', () => {
    const { container } = render(getJsonData('abc', '{"foo":1,"bar":"b"}'));
    const items = container.querySelectorAll('li');
    expect(items).toHaveLength(2);
    expect(items[0]?.textContent).toBe('Foo: 1');
    expect(items[1]?.textContent).toBe('Bar: b');
  });
});
