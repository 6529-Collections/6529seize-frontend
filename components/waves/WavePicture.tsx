"use client";

import { useContext, useMemo } from "react";
import { AuthContext } from "@/components/auth/Auth";
import { FallbackImage } from "@/components/common/FallbackImage";

interface WavePictureProps {
  readonly name: string;
  readonly picture: string | null;
  readonly contributors: {
    readonly pfp: string;
    readonly identity?: string | null;
  }[];
}

interface IdentitySource {
  readonly id?: string | null;
  readonly handle?: string | null;
  readonly normalised_handle?: string | null;
  readonly primary_wallet?: string | null;
  readonly primary_address?: string | null;
  readonly query?: string | null;
  readonly wallets?: ReadonlyArray<{ readonly wallet?: string | null }> | null;
}

const polygonsByCount: Record<number, string[]> = {
  // 1 entire area
  1: ["polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)"],

  // 2 halves: left, right
  2: [
    "polygon(0% 0%, 50% 0%, 50% 100%, 0% 100%)", // left
    "polygon(50% 0%, 100% 0%, 100% 100%, 50% 100%)", // right
  ],

  // 3 horizontal strips: top, middle, bottom
  3: [
    "polygon(0% 0%, 100% 0%, 100% 33.33%, 0% 33.33%)", // top
    "polygon(0% 33.33%, 100% 33.33%, 100% 66.66%, 0% 66.66%)", // middle
    "polygon(0% 66.66%, 100% 66.66%, 100% 100%, 0% 100%)", // bottom
  ],

  // 4 quadrants
  4: [
    "polygon(0% 0%, 50% 0%, 50% 50%, 0% 50%)", // top-left
    "polygon(50% 0%, 100% 0%, 100% 50%, 50% 50%)", // top-right
    "polygon(0% 50%, 50% 50%, 50% 100%, 0% 100%)", // bottom-left
    "polygon(50% 50%, 100% 50%, 100% 100%, 50% 100%)", // bottom-right
  ],

  // 5 horizontal strips (each 20% height)
  5: [
    "polygon(0% 0%, 100% 0%, 100% 20%, 0% 20%)",
    "polygon(0% 20%, 100% 20%, 100% 40%, 0% 40%)",
    "polygon(0% 40%, 100% 40%, 100% 60%, 0% 60%)",
    "polygon(0% 60%, 100% 60%, 100% 80%, 0% 80%)",
    "polygon(0% 80%, 100% 80%, 100% 100%, 0% 100%)",
  ],

  // 6 => 2 rows × 3 columns each
  6: [
    // top-left
    "polygon(0% 0%, 33.33% 0%, 33.33% 50%, 0% 50%)",
    // top-middle
    "polygon(33.33% 0%, 66.66% 0%, 66.66% 50%, 33.33% 50%)",
    // top-right
    "polygon(66.66% 0%, 100% 0%, 100% 50%, 66.66% 50%)",
    // bottom-left
    "polygon(0% 50%, 33.33% 50%, 33.33% 100%, 0% 100%)",
    // bottom-middle
    "polygon(33.33% 50%, 66.66% 50%, 66.66% 100%, 33.33% 100%)",
    // bottom-right
    "polygon(66.66% 50%, 100% 50%, 100% 100%, 66.66% 100%)",
  ],
};

const normalizeIdentity = (value: string | null | undefined): string | null => {
  if (!value) {
    return null;
  }

  const trimmed = value.trim().toLowerCase();
  if (!trimmed) {
    return null;
  }

  return trimmed.startsWith("@") ? trimmed.slice(1) : trimmed;
};

const addIdentityCandidate = (
  candidates: Set<string>,
  value: string | null | undefined
) => {
  const normalized = normalizeIdentity(value);
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

const addIdentitySourceCandidates = (
  candidates: Set<string>,
  identity: IdentitySource | null | undefined
) => {
  if (!identity) {
    return;
  }

  addIdentityCandidate(candidates, identity.id);
  addIdentityCandidate(candidates, identity.handle);
  addIdentityCandidate(candidates, identity.normalised_handle);
  addIdentityCandidate(candidates, identity.primary_wallet);
  addIdentityCandidate(candidates, identity.primary_address);
  addIdentityCandidate(candidates, identity.query);

  identity.wallets?.forEach((wallet) =>
    addIdentityCandidate(candidates, wallet.wallet)
  );
};

export default function WavePicture({
  name,
  picture,
  contributors,
}: WavePictureProps) {
  const { connectedProfile, activeProfileProxy } = useContext(AuthContext);

  const authenticatedIdentityCandidates = useMemo(() => {
    const candidates = new Set<string>();

    addIdentitySourceCandidates(candidates, connectedProfile);
    addIdentitySourceCandidates(candidates, activeProfileProxy?.created_by);

    return candidates;
  }, [activeProfileProxy, connectedProfile]);

  if (picture) {
    return (
      <div className="tw-relative tw-h-full tw-w-full tw-overflow-hidden tw-rounded-full">
        <FallbackImage
          primarySrc={picture}
          fallbackSrc={picture}
          alt={name}
          fill
          sizes="64px"
          className="tw-object-cover"
        />
      </div>
    );
  }

  const pfps = contributors
    .filter((contributor) => {
      if (!contributor.pfp) {
        return false;
      }

      const normalizedContributorIdentity = normalizeIdentity(
        contributor.identity
      );
      if (!normalizedContributorIdentity) {
        return true;
      }

      return !authenticatedIdentityCandidates.has(
        normalizedContributorIdentity
      );
    })
    .map((contributor) => contributor.pfp);

  // 3) If no PFPS, show fallback background
  if (pfps.length === 0) {
    return (
      <div className="tw-h-full tw-w-full tw-rounded-full tw-bg-gradient-to-br tw-from-iron-800 tw-to-iron-700" />
    );
  }

  // 4) Use up to N slices
  const maxSlices = 6;
  const sliceCount = Math.min(pfps.length, maxSlices);

  // 5) Grab the polygons for that sliceCount
  const polygons = polygonsByCount[sliceCount];

  return (
    <div className="tw-relative tw-h-full tw-w-full">
      {pfps.slice(0, sliceCount).map((pfp, i) => {
        const clip = polygons?.[i];
        return (
          <div
            key={pfp + i}
            className="tw-absolute tw-inset-0"
            style={{ clipPath: clip }}
          >
            <FallbackImage
              primarySrc={pfp}
              fallbackSrc={pfp}
              alt={`Contributor-${i}`}
              fill
              sizes="64px"
              className="tw-block tw-rounded-full tw-object-cover"
            />
          </div>
        );
      })}
    </div>
  );
}
