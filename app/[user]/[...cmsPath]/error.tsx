"use client";

import { useEffect } from "react";

import { ProfileCmsState } from "@/components/profile-cms/CmsSiteStates";

export default function ProfileCmsRouteError({
  error,
  unstable_retry,
}: {
  readonly error: Error & { digest?: string | undefined };
  readonly unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <ProfileCmsState
      title="Website unavailable"
      action={
        <button
          className="tw-min-h-11 tw-border tw-border-solid tw-border-primary-400 tw-bg-primary-500/10 tw-px-4 tw-py-2 tw-text-sm tw-font-semibold tw-text-white tw-transition hover:tw-bg-primary-500/20"
          type="button"
          onClick={() => unstable_retry()}
        >
          Try again
        </button>
      }
    >
      <p>This profile website could not be rendered.</p>
    </ProfileCmsState>
  );
}
