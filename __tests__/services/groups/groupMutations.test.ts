import {
  GROUP_EXCLUDE_LIMIT,
  GROUP_INCLUDE_LIMIT,
  ValidationIssue,
  validateGroupPayload,
} from '@/services/groups/groupMutations';
import { ApiCreateGroup } from '@/generated/models/ApiCreateGroup';

const createPayload = (overrides: Partial<ApiCreateGroup> = {}): ApiCreateGroup => {
  const { group: groupOverrides, ...rest } = overrides;
  return {
    name: 'Test',
    group: {
      tdh: { min: null, max: null },
      rep: { min: null, max: null, direction: null, user_identity: null, category: null },
      cic: { min: null, max: null, direction: null, user_identity: null },
      level: { min: null, max: null },
      owns_nfts: [],
      identity_addresses: [],
      excluded_identity_addresses: [],
      ...(groupOverrides ?? {}),
    },
    is_private: false,
    ...rest,
  };
};

const expectIssue = (issues: ValidationIssue[], issue: ValidationIssue) => {
  expect(issues).toContain(issue);
};

describe('validateGroupPayload', () => {
  it('marks payload valid when include wallets present', () => {
    const result = validateGroupPayload(
      createPayload({
        group: {
          identity_addresses: ['0x1'],
        },
      })
    );

    expect(result.valid).toBe(true);
    expect(result.issues).toHaveLength(0);
  });

  it('flags missing filters', () => {
    const result = validateGroupPayload(createPayload());
    expect(result.valid).toBe(false);
    expectIssue(result.issues, 'NO_FILTERS');
  });

  it('marks payload valid when only exclude wallets present', () => {
    const result = validateGroupPayload(
      createPayload({
        group: {
          excluded_identity_addresses: ['0xdead'],
        },
      })
    );

    expect(result.valid).toBe(true);
    expect(result.issues).toHaveLength(0);
  });

  it('flags include list above limit', () => {
    const include = Array.from({ length: GROUP_INCLUDE_LIMIT + 1 }, (_, idx) => `0x${idx}`);
    const result = validateGroupPayload(
      createPayload({
        group: {
          identity_addresses: include,
        },
      })
    );
    expect(result.valid).toBe(false);
    expectIssue(result.issues, 'INCLUDE_LIMIT');
  });

  it('flags exclude list above limit', () => {
    const exclude = Array.from({ length: GROUP_EXCLUDE_LIMIT + 1 }, (_, idx) => `0x${idx}`);
    const result = validateGroupPayload(
      createPayload({
        group: {
          identity_addresses: ['0x1'],
          excluded_identity_addresses: exclude,
        },
      })
    );
    expect(result.valid).toBe(false);
    expectIssue(result.issues, 'EXCLUDE_LIMIT');
  });
});
