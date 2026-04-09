"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { PlusIcon } from "@heroicons/react/24/outline";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import type { ApiWave } from "@/generated/models/ApiWave";
import { useWaveCurations } from "@/hooks/waves/useWaveCurations";
import MyStreamWaveCurationCreateDialog from "@/components/brain/my-stream/tabs/MyStreamWaveCurationCreateDialog";

interface WaveCurationGroupsSectionProps {
  readonly wave: ApiWave;
}

const baseButtonClassName =
  "tw-inline-flex tw-w-full tw-items-center tw-justify-between tw-rounded-lg tw-border tw-border-solid tw-px-3 tw-py-2 tw-text-sm tw-font-medium tw-transition";

const getButtonClassName = (isActive: boolean) =>
  `${baseButtonClassName} ${
    isActive
      ? "tw-border-primary-400 tw-bg-primary-500/10 tw-text-primary-300"
      : "tw-border-iron-700 tw-bg-iron-900 tw-text-iron-200 desktop-hover:hover:tw-border-iron-500 desktop-hover:hover:tw-text-white"
  }`;

export default function WaveCurationGroupsSection({
  wave,
}: WaveCurationGroupsSectionProps) {
  const { isApp } = useDeviceInfo();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const activeCurationId = searchParams.get("curation");
  const canManageCurations =
    wave.wave.authenticated_user_eligible_for_admin === true;
  const { data: curations = [] } = useWaveCurations({
    waveId: wave.id,
    enabled: isApp,
  });

  const updateSelectedCuration = (curationId: string | null) => {
    const params = new URLSearchParams(searchParams.toString() || "");

    if (curationId) {
      params.set("curation", curationId);
    } else {
      params.delete("curation");
    }

    const nextQuery = params.toString();
    const nextUrl = nextQuery ? `${pathname}?${nextQuery}` : pathname;
    router.replace(nextUrl, { scroll: false });
  };

  if (!isApp || (curations.length === 0 && !canManageCurations)) {
    return null;
  }

  return (
    <>
      <div className="tw-pb-4">
        <div className="tw-flex tw-items-start tw-justify-between tw-gap-x-6 tw-px-4 tw-pt-4">
          <p className="tw-mb-0 tw-text-base tw-font-semibold tw-tracking-tight tw-text-iron-200">
            Curations
          </p>

          {canManageCurations && (
            <button
              type="button"
              onClick={() => setIsCreateOpen(true)}
              className="tw-inline-flex tw-size-8 tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-text-iron-200 tw-transition desktop-hover:hover:tw-border-iron-500 desktop-hover:hover:tw-bg-iron-800 desktop-hover:hover:tw-text-white"
              aria-label="Create curation"
              title="Create curation"
            >
              <PlusIcon className="tw-size-4" />
            </button>
          )}
        </div>

        <div className="tw-mt-2 tw-flex tw-flex-col tw-gap-y-2 tw-px-4">
          <button
            type="button"
            onClick={() => updateSelectedCuration(null)}
            className={getButtonClassName(!activeCurationId)}
            aria-pressed={!activeCurationId}
          >
            <span>Chat</span>
          </button>

          {curations.map((curation) => {
            const isActive = curation.id === activeCurationId;

            return (
              <button
                key={curation.id}
                type="button"
                onClick={() => updateSelectedCuration(curation.id)}
                className={getButtonClassName(isActive)}
                aria-pressed={isActive}
              >
                <span className="tw-truncate">{curation.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {isCreateOpen && (
        <MyStreamWaveCurationCreateDialog
          wave={wave}
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          onSaved={(curation) => updateSelectedCuration(curation.id)}
        />
      )}
    </>
  );
}
