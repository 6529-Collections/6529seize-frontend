"use client";

import { useContext } from "react";
import type { ApiWave } from "@/generated/models/ApiWave";
import { AuthContext } from "@/components/auth/Auth";
import Button from "@/components/utils/button/Button";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { useWaveJoin } from "@/hooks/waves/useWaveJoin";
import { t } from "@/i18n/messages";

export default function WaveItemFollow({ wave }: { readonly wave: ApiWave }) {
  const { connectedProfile, activeProfileProxy } = useContext(AuthContext);
  const { isJoined: isSubscribed, isPending, toggle } = useWaveJoin(wave);
  const locale = useBrowserLocale();
  const label = t(
    locale,
    isSubscribed ? "waves.join.listFollowing" : "waves.join.listFollow"
  );
  const canSubscribe = !!connectedProfile?.handle && !activeProfileProxy;

  return (
    <Button
      onClick={toggle}
      disabled={!canSubscribe}
      loading={isPending}
      hideChildrenWhenLoading
      variant={isSubscribed ? "secondary" : "primary"}
      size="xs"
    >
      {isSubscribed ? (
        <svg
          className="tw-h-3 tw-w-3"
          viewBox="0 0 17 15"
          fill="none"
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
          width="17"
          height="15"
        >
          <path
            d="M14.7953 0.853403L5.24867 10.0667L2.71534 7.36007C2.24867 6.92007 1.51534 6.8934 0.982005 7.26674C0.462005 7.6534 0.315338 8.3334 0.635338 8.88007L3.63534 13.7601C3.92867 14.2134 4.43534 14.4934 5.00867 14.4934C5.55534 14.4934 6.07534 14.2134 6.36867 13.7601C6.84867 13.1334 16.0087 2.2134 16.0087 2.2134C17.2087 0.986737 15.7553 -0.093263 14.7953 0.84007V0.853403Z"
            fillRule="evenodd"
            clipRule="evenodd"
            fill="currentColor"
          />
        </svg>
      ) : (
        <svg
          className="-tw-ml-0.5 tw-mr-0.5 tw-h-4 tw-w-4"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12 5V19M5 12H19"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
      <span>{label}</span>
    </Button>
  );
}
