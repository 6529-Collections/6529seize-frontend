interface IdentitySource {
  readonly id?: string | null | undefined;
  readonly handle?: string | null | undefined;
  readonly normalised_handle?: string | null | undefined;
  readonly primary_wallet?: string | null | undefined;
  readonly primary_address?: string | null | undefined;
  readonly query?: string | null | undefined;
  readonly wallets?:
    | ReadonlyArray<{
        readonly wallet?: string | null | undefined;
        readonly address?: string | null | undefined;
      }>
    | null
    | undefined;
}

export const normalizeDirectMessageIdentity = (
  value: string | null | undefined
): string | null => {
  if (!value) {
    return null;
  }

  const trimmed = value.trim().toLowerCase();
  if (!trimmed) {
    return null;
  }

  return trimmed.startsWith("@") ? trimmed.slice(1) : trimmed;
};

const getRouteIdentity = (value: string): string | null => {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  return trimmed.startsWith("@") ? trimmed.slice(1) : trimmed;
};

const isSingleProfileRouteTarget = (value: string): boolean => {
  return !/[\s,/\\&+]/.test(value);
};

const addDirectMessageIdentityCandidate = (
  candidates: Set<string>,
  value: string | null | undefined
) => {
  const normalized = normalizeDirectMessageIdentity(value);
  if (!normalized) {
    return;
  }

  candidates.add(normalized);

  if (normalized.startsWith("0x")) {
    candidates.add(`id-${normalized}`);
  }

  if (normalized.startsWith("id-0x")) {
    candidates.add(normalized.slice(3));
  }
};

export const buildDirectMessageIdentityCandidates = (
  ...identities: ReadonlyArray<IdentitySource | null | undefined>
): Set<string> => {
  const candidates = new Set<string>();

  identities.forEach((identity) => {
    if (!identity) {
      return;
    }

    addDirectMessageIdentityCandidate(candidates, identity.id);
    addDirectMessageIdentityCandidate(candidates, identity.handle);
    addDirectMessageIdentityCandidate(candidates, identity.normalised_handle);
    addDirectMessageIdentityCandidate(candidates, identity.primary_wallet);
    addDirectMessageIdentityCandidate(candidates, identity.primary_address);
    addDirectMessageIdentityCandidate(candidates, identity.query);

    identity.wallets?.forEach((wallet) => {
      addDirectMessageIdentityCandidate(candidates, wallet.wallet);
      addDirectMessageIdentityCandidate(candidates, wallet.address);
    });
  });

  return candidates;
};

export const getDirectMessageProfileHref = ({
  isDirectMessage,
  identity,
  connectedProfile,
  activeProfileProxyCreatedBy,
}: {
  readonly isDirectMessage: boolean;
  readonly identity: string | null | undefined;
  readonly connectedProfile: IdentitySource | null | undefined;
  readonly activeProfileProxyCreatedBy: IdentitySource | null | undefined;
}): string | null => {
  if (!isDirectMessage) {
    return null;
  }

  const authenticatedIdentityCandidates = buildDirectMessageIdentityCandidates(
    connectedProfile,
    activeProfileProxyCreatedBy
  );

  const routeIdentity = identity ? getRouteIdentity(identity) : null;
  const normalizedRouteIdentity = normalizeDirectMessageIdentity(routeIdentity);
  if (
    !routeIdentity ||
    !normalizedRouteIdentity ||
    !isSingleProfileRouteTarget(routeIdentity) ||
    authenticatedIdentityCandidates.has(normalizedRouteIdentity)
  ) {
    return null;
  }

  return `/${encodeURIComponent(routeIdentity)}`;
};
