import { DropHasher } from '../..//utils/drop-hasher';
import { sha256 } from 'js-sha256';

describe('DropHasher', () => {
  const hasher = new DropHasher();

  it('canonicalJSONStringify sorts object keys and ignores undefined', () => {
    const obj = { b: 1, a: 2, c: undefined } as any;
    const result = (hasher as any).canonicalJSONStringify(obj);
    expect(result).toBe('{"a":2,"b":1}');
  });

  it('canonicalJSONStringify handles arrays', () => {
    const arr = [1, { z: 3, y: 4 }];
    const result = (hasher as any).canonicalJSONStringify(arr);
    expect(result).toBe('[1,{"y":4,"z":3}]');
  });

  it('hash computes sha256 of canonical JSON', () => {
    const drop = { id: '1', name: 'drop', signature: 'sig' } as any;
    const terms = 'tos';
    const expected = sha256('{"id":"1","name":"drop","terms_of_service":"tos"}');
    expect(hasher.hash({ drop, termsOfService: terms })).toBe(expected);
  });
});
