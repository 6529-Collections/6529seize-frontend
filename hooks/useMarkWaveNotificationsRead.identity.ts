import { jwtDecode } from "jwt-decode";
import { useMemo } from "react";

export type AuthHeaders = Record<string, string>;

interface WaveReadJwtPayload {
  readonly sub?: string | undefined;
  readonly role?: string | null | undefined;
}

export interface WaveReadVerifiedIdentity {
  readonly addressKey: string;
  readonly activeProfileProxyId: string | null;
  readonly activeProfileProxyCreatorId: string | null;
  readonly identityKey: string;
  readonly authHeaders: AuthHeaders;
}

interface WaveReadJwtIdentity {
  readonly addressKey: string;
  readonly proxyCreatorId: string | null;
}

export interface WaveReadTemporaryProxyRoleIdentity {
  readonly addressKey: string;
  readonly proxyCreatorId: string;
  readonly identityKey: string;
}

export interface WaveReadIdentityConfig {
  readonly address: string | undefined;
  readonly activeProfileProxyId: string | null;
  readonly activeProfileProxyCreatorId: string | null;
  readonly walletAuth: string | null;
}

interface WaveReadIdentityState {
  readonly addressKey: string | null;
  readonly activeProfileProxyId: string | null;
  readonly identityKey: string;
  readonly temporaryProxyRoleIdentity:
    | WaveReadTemporaryProxyRoleIdentity
    | undefined;
  readonly verifiedIdentity: WaveReadVerifiedIdentity | undefined;
}

const getAddressKey = (address: string | undefined): string | null =>
  address?.toLowerCase() ?? null;

export const getWaveReadIdentityKey = ({
  addressKey,
  activeProfileProxyId,
}: {
  readonly addressKey: string | null;
  readonly activeProfileProxyId: string | null;
}): string => JSON.stringify([addressKey, activeProfileProxyId]);

export const getWaveReadProxyRoleIdentityKey = ({
  addressKey,
  proxyCreatorId,
}: {
  readonly addressKey: string;
  readonly proxyCreatorId: string;
}): string => JSON.stringify([addressKey, "proxy-role", proxyCreatorId]);

export const getWaveReadRequestKey = ({
  addressKey,
  activeProfileProxyId,
  waveId,
}: {
  readonly addressKey: string | null;
  readonly activeProfileProxyId: string | null;
  readonly waveId: string;
}): string => JSON.stringify([addressKey, activeProfileProxyId, waveId]);

export const getWaveReadProxyRoleRequestKey = ({
  addressKey,
  proxyCreatorId,
  waveId,
}: {
  readonly addressKey: string;
  readonly proxyCreatorId: string;
  readonly waveId: string;
}): string =>
  JSON.stringify([addressKey, "proxy-role", proxyCreatorId, waveId]);

const getAuthHeaders = (walletAuth: string): AuthHeaders => ({
  Authorization: `Bearer ${walletAuth}`,
});

const decodeWaveReadJwtIdentity = (
  walletAuth: string | null
): WaveReadJwtIdentity | undefined => {
  if (!walletAuth) {
    return undefined;
  }

  try {
    const decodedJwt = jwtDecode<WaveReadJwtPayload>(walletAuth);
    const addressKey = decodedJwt.sub?.toLowerCase() ?? null;
    if (!addressKey) {
      return undefined;
    }

    return {
      addressKey,
      proxyCreatorId:
        typeof decodedJwt.role === "string" && decodedJwt.role.length > 0
          ? decodedJwt.role
          : null,
    };
  } catch {
    return undefined;
  }
};

const getVerifiedAuthHeaders = ({
  walletAuth,
  addressKey,
  jwtIdentity,
  activeProfileProxyCreatorId,
}: {
  readonly walletAuth: string | null;
  readonly addressKey: string | null;
  readonly jwtIdentity: WaveReadJwtIdentity | undefined;
  readonly activeProfileProxyCreatorId: string | null;
}): AuthHeaders | undefined => {
  if (!walletAuth || !addressKey || !jwtIdentity) {
    return undefined;
  }

  if (jwtIdentity.addressKey !== addressKey) {
    return undefined;
  }

  if (jwtIdentity.proxyCreatorId !== activeProfileProxyCreatorId) {
    return undefined;
  }

  return getAuthHeaders(walletAuth);
};

const getTemporaryProxyRoleIdentity = ({
  addressKey,
  activeProfileProxyId,
  jwtIdentity,
}: {
  readonly addressKey: string | null;
  readonly activeProfileProxyId: string | null;
  readonly jwtIdentity: WaveReadJwtIdentity | undefined;
}): WaveReadTemporaryProxyRoleIdentity | undefined => {
  if (addressKey === null || activeProfileProxyId !== null) {
    return undefined;
  }

  const proxyCreatorId =
    jwtIdentity?.addressKey === addressKey ? jwtIdentity.proxyCreatorId : null;

  if (proxyCreatorId === null) {
    return undefined;
  }

  return {
    addressKey,
    proxyCreatorId,
    identityKey: getWaveReadProxyRoleIdentityKey({
      addressKey,
      proxyCreatorId,
    }),
  };
};

const getVerifiedIdentity = ({
  addressKey,
  activeProfileProxyId,
  activeProfileProxyCreatorId,
  identityKey,
  verifiedAuthHeaders,
}: {
  readonly addressKey: string | null;
  readonly activeProfileProxyId: string | null;
  readonly activeProfileProxyCreatorId: string | null;
  readonly identityKey: string;
  readonly verifiedAuthHeaders: AuthHeaders | undefined;
}): WaveReadVerifiedIdentity | undefined => {
  if (!verifiedAuthHeaders || addressKey === null) {
    return undefined;
  }

  return {
    addressKey,
    activeProfileProxyId,
    activeProfileProxyCreatorId,
    identityKey,
    authHeaders: verifiedAuthHeaders,
  };
};

export const useWaveReadIdentityState = ({
  address,
  activeProfileProxyId,
  activeProfileProxyCreatorId,
  walletAuth,
}: WaveReadIdentityConfig): WaveReadIdentityState => {
  const addressKey = getAddressKey(address);
  const identityKey = getWaveReadIdentityKey({
    addressKey,
    activeProfileProxyId,
  });
  const jwtIdentity = useMemo(
    () => decodeWaveReadJwtIdentity(walletAuth),
    [walletAuth]
  );
  const verifiedAuthHeaders = useMemo(
    () =>
      getVerifiedAuthHeaders({
        walletAuth,
        addressKey,
        jwtIdentity,
        activeProfileProxyCreatorId,
      }),
    [walletAuth, addressKey, jwtIdentity, activeProfileProxyCreatorId]
  );
  const temporaryProxyRoleIdentity = useMemo(
    () =>
      getTemporaryProxyRoleIdentity({
        addressKey,
        activeProfileProxyId,
        jwtIdentity,
      }),
    [activeProfileProxyId, addressKey, jwtIdentity]
  );
  const verifiedIdentity = useMemo(
    () =>
      getVerifiedIdentity({
        addressKey,
        activeProfileProxyId,
        activeProfileProxyCreatorId,
        identityKey,
        verifiedAuthHeaders,
      }),
    [
      activeProfileProxyCreatorId,
      activeProfileProxyId,
      addressKey,
      identityKey,
      verifiedAuthHeaders,
    ]
  );

  return {
    addressKey,
    activeProfileProxyId,
    identityKey,
    temporaryProxyRoleIdentity,
    verifiedIdentity,
  };
};
