import { getMissingRequirements } from '@/components/waves/utils/getMissingRequirements';
import { ApiWaveParticipationRequirement } from '@/generated/models/ApiWaveParticipationRequirement';
import { ApiWaveMetadataType } from '@/generated/models/ApiWaveMetadataType';

describe('getMissingRequirements', () => {
  function createFile(type: string): File {
    return new File([''], 'f', { type });
  }

  it('returns empty arrays when not in drop mode', () => {
    const result = getMissingRequirements(false, [], [], []);
    expect(result).toEqual({ metadata: [], media: [] });
  });

  it('detects missing required metadata', () => {
    const metadata = [
      { key: 'a', type: ApiWaveMetadataType.String, value: 'x', required: true },
      { key: 'b', type: ApiWaveMetadataType.String, value: '', required: true },
      { key: 'c', type: ApiWaveMetadataType.Number, value: null, required: true },
      { key: 'd', type: ApiWaveMetadataType.String, value: 'ok', required: false },
    ];
    const result = getMissingRequirements(true, metadata as any, [], []);
    expect(result.metadata).toEqual(['b', 'c']);
    expect(result.media).toEqual([]);
  });

  it('detects missing media types', () => {
    const files = [createFile('image/png'), createFile('audio/mp3')];
    const req = [
      ApiWaveParticipationRequirement.Image,
      ApiWaveParticipationRequirement.Audio,
      ApiWaveParticipationRequirement.Video,
    ];
    const result = getMissingRequirements(true, [], files, req);
    expect(result.metadata).toEqual([]);
    expect(result.media).toEqual([ApiWaveParticipationRequirement.Video]);
  });
});
