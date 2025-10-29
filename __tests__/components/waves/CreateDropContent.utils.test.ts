import { convertMetadataToDropMetadata } from '@/components/waves/utils/convertMetadataToDropMetadata';
import { ApiWaveMetadataType } from '@/generated/models/ApiWaveMetadataType';

describe('CreateDropContent utilities', () => {
  describe('convertMetadataToDropMetadata', () => {
    it('filters out entries without key or value', () => {
      const result = convertMetadataToDropMetadata([
        { key: 'a', type: ApiWaveMetadataType.String, value: '1', required: true },
        { key: null, type: null, value: null, required: false },
        { key: 'b', type: ApiWaveMetadataType.Number, value: 2, required: false },
      ]);
      expect(result).toEqual([
        { data_key: 'a', data_value: '1' },
        { data_key: 'b', data_value: '2' },
      ]);
    });
  });

  it('handles numeric metadata values', () => {
    const out = convertMetadataToDropMetadata([
      { key: 'num', type: ApiWaveMetadataType.Number, value: 10, required: true },
    ]);

    expect(out).toEqual([{ data_key: 'num', data_value: '10' }]);
  });
});
