type SelectableIdentityCandidate = {
  readonly primary_wallet?: string | null | undefined;
  readonly wallet?: string | null | undefined;
  readonly handle?: string | null | undefined;
};

export const getSelectableIdentity = (
  profile: SelectableIdentityCandidate | null | undefined
): string | null => {
  if (!profile) {
    return null;
  }

  return profile.primary_wallet ?? profile.wallet ?? profile.handle ?? null;
};
