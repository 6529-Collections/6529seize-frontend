import { handleDropPart, convertMetadataToDropMetadata } from '../../../components/waves/CreateDropContent';
import { ApiWaveMetadataType } from '../../../generated/models/ApiWaveMetadataType';

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

  describe('handleDropPart', () => {
    it('updates mentions and nfts based on markdown', () => {
      const markdown = 'Hello @[alice] #[coolNFT]';
      const existingMentions = [{ mentioned_profile_id: '1', handle_in_content: 'alice' }];
      const existingNfts = [] as any[];
      const mentionedUsers = [
        { mentioned_profile_id: '1', handle_in_content: 'alice', current_handle: null },
        { mentioned_profile_id: '2', handle_in_content: 'bob', current_handle: null },
      ];
      const referencedNfts = [
        { contract: 'c', token: '1', name: 'coolNFT' },
        { contract: 'c', token: '2', name: 'other' },
      ];
      const res = handleDropPart(markdown, existingMentions as any, existingNfts, mentionedUsers, referencedNfts);
      expect(res.updatedMentions).toEqual(existingMentions);
      expect(res.updatedNfts).toEqual([{ contract: 'c', token: '1', name: 'coolNFT' }]);
      expect(res.updatedMarkdown).toBe(markdown);
    });

    it('adds new mentions and nfts', () => {
      const markdown = 'hi @[bob] #[other]';
      const existingMentions: any[] = [];
      const existingNfts: any[] = [];
      const mentionedUsers = [
        { mentioned_profile_id: '2', handle_in_content: 'bob', current_handle: null },
      ];
      const referencedNfts = [
        { contract: 'c', token: '2', name: 'other' },
      ];
      const res = handleDropPart(markdown, existingMentions, existingNfts, mentionedUsers as any, referencedNfts as any);
      expect(res.updatedMentions).toEqual(mentionedUsers);
      expect(res.updatedNfts).toEqual(referencedNfts);
    });
  });

  it('returns empty markdown string when input is null', () => {
    const res = handleDropPart(null, [], [], [], []);
    expect(res.updatedMarkdown).toBe('');
    expect(res.updatedMentions).toEqual([]);
    expect(res.updatedNfts).toEqual([]);
  });

  it('handles numeric metadata values', () => {
    const out = convertMetadataToDropMetadata([
      { key: 'num', type: ApiWaveMetadataType.Number, value: 10, required: true },
    ]);
    expect(out).toEqual([{ data_key: 'num', data_value: '10' }]);
  });
});
