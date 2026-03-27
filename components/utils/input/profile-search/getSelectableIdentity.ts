type SelectableIdentityCandidate = {
  readonly primary_wallet?: string | null | undefined;
  readonly wallet?: string | null | undefined;
  readonly handle?: string | null | undefined;
  readonly display?: string | null | undefined;
  readonly pfp?: string | null | undefined;
  readonly profile_id?: string | null | undefined;
  readonly id?: string | null | undefined;
};

export type SelectableIdentityOption = {
  readonly value: string;
  readonly label: string;
  readonly secondaryLabel: string | null;
  readonly avatarUrl: string | null;
  readonly profileId: string | null;
};

const isNonEmptyString = (value: string | null | undefined): value is string =>
  value !== null && value !== undefined && value.length > 0;

const getFirstNonEmptyString = (
  ...values: readonly (string | null | undefined)[]
): string | null =>
  values.find((value): value is string => isNonEmptyString(value)) ?? null;

export const getSelectableIdentity = (
  profile: SelectableIdentityCandidate | null | undefined
): string | null => {
  if (!profile) {
    return null;
  }

  return profile.primary_wallet ?? profile.wallet ?? profile.handle ?? null;
};

export const getSelectableIdentityOption = (
  profile: SelectableIdentityCandidate | null | undefined
): SelectableIdentityOption | null => {
  const value = getSelectableIdentity(profile);
  if (!isNonEmptyString(value)) {
    return null;
  }

  const label =
    getFirstNonEmptyString(
      profile?.handle,
      profile?.primary_wallet,
      profile?.wallet,
      value
    ) ?? value;
  const secondaryLabel =
    [
      profile?.handle,
      profile?.primary_wallet,
      profile?.wallet,
      profile?.display,
    ].find(
      (candidate): candidate is string =>
        isNonEmptyString(candidate) && candidate !== label
    ) ?? null;

  return {
    value,
    label,
    secondaryLabel,
    avatarUrl: profile?.pfp ?? null,
    profileId: profile?.profile_id ?? profile?.id ?? null,
  };
};
