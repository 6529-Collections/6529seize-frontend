"use client";

import MyStreamWaveCurationCreateDialog from "@/components/brain/my-stream/tabs/MyStreamWaveCurationCreateDialog";
import MobileWrapperDialog from "@/components/mobile-wrapper-dialog/MobileWrapperDialog";
import { Spinner } from "@/components/dotLoader/DotLoader";
import PrimaryButton from "@/components/utils/button/PrimaryButton";
import SecondaryButton from "@/components/utils/button/SecondaryButton";
import { getDropCurationsQueryKey } from "@/hooks/drops/useDropCurations";
import clsx from "clsx";
import { useMemo, useState } from "react";
import {
  type DropCurationMembership,
  useDropCurations,
} from "@/hooks/drops/useDropCurations";
import { useDropCurationMembershipMutation } from "@/hooks/drops/useDropCurationMembershipMutation";
import { useQueryClient } from "@tanstack/react-query";
import type { ApiWaveCuration } from "@/generated/models/ApiWaveCuration";

function CurationsSection({
  title,
  children,
}: {
  readonly title: string;
  readonly children: React.ReactNode;
}) {
  return (
    <section className="tw-flex tw-flex-col tw-gap-3">
      <p className="tw-mb-0 tw-text-sm tw-font-medium tw-text-iron-300">
        {title}
      </p>
      <div className="tw-flex tw-flex-col tw-gap-2">{children}</div>
    </section>
  );
}

function MembershipActionButton({
  action,
  disabled,
  loading,
  onClick,
}: {
  readonly action: "add" | "remove";
  readonly disabled: boolean;
  readonly loading: boolean;
  readonly onClick: () => void;
}) {
  const isAdd = action === "add";

  return (
    <button
      type="button"
      disabled={disabled || loading}
      onClick={disabled || loading ? undefined : onClick}
      className={clsx(
        "tw-inline-flex tw-min-w-[5.5rem] tw-items-center tw-justify-center tw-gap-x-2 tw-rounded-lg tw-border tw-border-solid tw-px-3.5 tw-py-2 tw-text-xs tw-font-semibold tw-transition-all tw-duration-300 tw-ease-out",
        isAdd
          ? "tw-border-white tw-bg-iron-100 tw-text-iron-950 tw-shadow-[0_0_10px_rgba(255,255,255,0.2)] desktop-hover:hover:-tw-translate-y-0.5 desktop-hover:hover:tw-bg-iron-50 desktop-hover:hover:tw-shadow-[0_0_15px_rgba(255,255,255,0.3)]"
          : "tw-border-white/20 tw-bg-iron-900 tw-text-iron-100 tw-shadow-[0_2px_10px_rgba(0,0,0,0.2)] desktop-hover:hover:tw-border-white/40 desktop-hover:hover:tw-bg-iron-800",
        (disabled || loading) &&
          "tw-cursor-not-allowed tw-opacity-50 desktop-hover:hover:tw-translate-y-0 desktop-hover:hover:tw-shadow-none"
      )}
    >
      {loading && <Spinner dimension={14} />}
      <span>{isAdd ? "Add" : "Remove"}</span>
    </button>
  );
}

function CurationMembershipRow({
  curation,
  disabled,
  loading,
  onUpdateMembership,
}: {
  readonly curation: DropCurationMembership;
  readonly disabled: boolean;
  readonly loading: boolean;
  readonly onUpdateMembership: (action: "add" | "remove") => void;
}) {
  const membershipAction = curation.drop_included ? "remove" : "add";

  return (
    <div
      className={clsx(
        "tw-group tw-relative tw-flex tw-items-center tw-justify-between tw-gap-3 tw-overflow-hidden tw-rounded-lg tw-border tw-border-solid tw-transition-all tw-duration-300",
        curation.drop_included
          ? "tw-border-white/30 tw-bg-iron-800 tw-p-3.5 tw-shadow-[0_4px_15px_rgba(0,0,0,0.4)]"
          : "tw-border-white/[0.06] tw-bg-iron-950 tw-p-3.5 desktop-hover:hover:tw-border-white/10 desktop-hover:hover:tw-bg-iron-900/60"
      )}
    >
      <div className="tw-min-w-0 tw-flex-1 tw-items-center tw-gap-2.5 sm:tw-flex">
        <p
          className={clsx(
            "tw-mb-0 tw-truncate tw-text-[15px] tw-font-semibold tw-leading-tight tw-transition-colors",
            curation.drop_included
              ? "tw-text-iron-50"
              : "tw-text-iron-200 desktop-hover:group-hover:tw-text-iron-50"
          )}
        >
          {curation.name}
        </p>
        {curation.drop_included && (
          <span className="tw-flex tw-h-4 tw-w-4 tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-full tw-bg-white/15">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="tw-h-2.5 tw-w-2.5 tw-text-iron-100"
              stroke="currentColor"
              strokeWidth="4"
              aria-hidden="true"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </span>
        )}
      </div>

      {curation.authenticated_user_can_curate ? (
        <MembershipActionButton
          action={membershipAction}
          disabled={disabled}
          loading={loading}
          onClick={() => onUpdateMembership(membershipAction)}
        />
      ) : (
        <span className="tw-inline-flex tw-min-w-[5.5rem] tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-solid tw-border-white/[0.04] tw-bg-iron-950/50 tw-px-3.5 tw-py-2 tw-text-xs tw-font-medium tw-text-iron-500">
          Read only
        </span>
      )}
    </div>
  );
}

export default function WaveDropCurationsDialog({
  dropId,
  wave,
  isOpen,
  onClose,
}: {
  readonly dropId: string;
  readonly wave: { readonly id: string };
  readonly isOpen: boolean;
  readonly onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [isCreateCurationOpen, setIsCreateCurationOpen] = useState(false);
  const {
    data: curations = [],
    isLoading,
    isError,
    refetch,
  } = useDropCurations({
    dropId,
    enabled: isOpen,
  });
  const { updateMembership, isPending, pendingCurationId } =
    useDropCurationMembershipMutation({
      dropId,
    });

  const sortedCurations = useMemo(
    () =>
      [...curations].sort((left, right) => {
        if (left.drop_included !== right.drop_included) {
          return Number(right.drop_included) - Number(left.drop_included);
        }

        return left.name.localeCompare(right.name);
      }),
    [curations]
  );
  const includedCurations = useMemo(
    () => sortedCurations.filter((curation) => curation.drop_included),
    [sortedCurations]
  );
  const availableCurations = useMemo(
    () =>
      sortedCurations.filter(
        (curation) =>
          !curation.drop_included && curation.authenticated_user_can_curate
      ),
    [sortedCurations]
  );
  const readOnlyCurations = useMemo(
    () =>
      sortedCurations.filter(
        (curation) =>
          !curation.drop_included && !curation.authenticated_user_can_curate
      ),
    [sortedCurations]
  );
  const showInlineCreateButton = sortedCurations.length > 0;

  const handleCreatedFromCurate = (curation: ApiWaveCuration) => {
    queryClient.setQueryData<DropCurationMembership[]>(
      getDropCurationsQueryKey(dropId),
      (current) => {
        const nextRow: DropCurationMembership = {
          ...curation,
          drop_included: false,
          authenticated_user_can_curate: true,
        };

        if (!current) {
          return [nextRow];
        }

        const existingIndex = current.findIndex(
          (item) => item.id === curation.id
        );
        if (existingIndex === -1) {
          return [...current, nextRow];
        }

        return current.map((item) =>
          item.id === curation.id ? { ...item, ...nextRow } : item
        );
      }
    );

    updateMembership(curation.id, "add");
  };

  return (
    <MobileWrapperDialog
      title="Curate"
      isOpen={isOpen}
      onClose={onClose}
      noPadding
      tabletModal={true}
      tall={true}
      maxWidthClass="md:tw-max-w-lg"
      headerClassName="tw-mb-4 tw-border-b tw-border-solid tw-border-x-0 tw-border-t-0 tw-border-iron-800 tw-pb-3 tw-pt-6"
    >
      <div className="tw-flex tw-min-h-0 tw-flex-1 tw-flex-col tw-pb-2">
        <div className="tw-min-h-0 tw-flex-1 tw-overflow-y-auto tw-scrollbar-thin tw-scrollbar-track-iron-800 tw-scrollbar-thumb-iron-500 desktop-hover:hover:tw-scrollbar-thumb-iron-300">
          <div className="tw-flex tw-flex-col tw-gap-6 tw-px-4 tw-pb-6 sm:tw-px-6">
            <div className="tw-flex tw-flex-col tw-gap-4 tw-pt-2 sm:tw-flex-row sm:tw-items-center sm:tw-justify-between">
              <p className="tw-mb-0 tw-text-sm tw-text-iron-400 sm:tw-flex-1 sm:tw-pr-4">
                Add or remove this drop from curations in this wave.
              </p>
              {showInlineCreateButton && (
                <div className="tw-flex tw-flex-shrink-0">
                  <SecondaryButton
                    onClicked={() => setIsCreateCurationOpen(true)}
                    size="sm"
                    className="!tw-text-xs"
                  >
                    Create and add curation
                  </SecondaryButton>
                </div>
              )}
            </div>

            {isLoading && (
              <div className="tw-flex tw-flex-1 tw-items-center tw-justify-center tw-py-16">
                <div className="tw-flex tw-items-center tw-gap-3 tw-text-sm tw-font-medium tw-text-iron-400">
                  <Spinner dimension={18} />
                  <span>Loading curations...</span>
                </div>
              </div>
            )}

            {!isLoading && isError && (
              <div className="tw-rounded-2xl tw-border tw-border-solid tw-border-white/[0.06] tw-bg-iron-900 tw-p-6 tw-text-center tw-shadow-sm">
                <p className="tw-mb-4 tw-text-sm tw-font-medium tw-text-iron-300">
                  Unable to load curations for this drop.
                </p>
                <div className="tw-flex tw-justify-center">
                  <SecondaryButton
                    onClicked={() => void refetch()}
                    size="sm"
                    className="!tw-text-xs"
                  >
                    Try again
                  </SecondaryButton>
                </div>
              </div>
            )}

            {!isLoading && !isError && sortedCurations.length === 0 && (
              <div className="tw-rounded-2xl tw-border tw-border-solid tw-border-white/[0.06] tw-bg-iron-900 tw-p-8 tw-text-center tw-shadow-sm">
                <p className="tw-mb-2 tw-text-base tw-font-semibold tw-text-iron-100">
                  No curations yet
                </p>
                <p className="tw-mb-6 tw-text-sm tw-text-iron-400">
                  Create the first curation for this wave and add this drop to
                  it.
                </p>
                <div className="tw-flex tw-justify-center">
                  <PrimaryButton
                    loading={false}
                    disabled={false}
                    onClicked={() => setIsCreateCurationOpen(true)}
                    padding="tw-px-4 tw-py-2"
                  >
                    Create first curation
                  </PrimaryButton>
                </div>
              </div>
            )}

            {!isLoading && !isError && sortedCurations.length > 0 && (
              <div className="tw-flex tw-flex-col tw-gap-6">
                {includedCurations.length > 0 && (
                  <CurationsSection title="Included">
                    {includedCurations.map((curation) => (
                      <CurationMembershipRow
                        key={curation.id}
                        curation={curation}
                        disabled={isPending}
                        loading={pendingCurationId === curation.id}
                        onUpdateMembership={(action) =>
                          updateMembership(curation.id, action)
                        }
                      />
                    ))}
                  </CurationsSection>
                )}

                {availableCurations.length > 0 && (
                  <CurationsSection title="Available to curate">
                    {availableCurations.map((curation) => (
                      <CurationMembershipRow
                        key={curation.id}
                        curation={curation}
                        disabled={isPending}
                        loading={pendingCurationId === curation.id}
                        onUpdateMembership={(action) =>
                          updateMembership(curation.id, action)
                        }
                      />
                    ))}
                  </CurationsSection>
                )}

                {readOnlyCurations.length > 0 && (
                  <div className="tw-flex tw-flex-col tw-gap-2">
                    {readOnlyCurations.map((curation) => (
                      <CurationMembershipRow
                        key={curation.id}
                        curation={curation}
                        disabled={true}
                        loading={false}
                        onUpdateMembership={() => undefined}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      {isCreateCurationOpen && (
        <MyStreamWaveCurationCreateDialog
          wave={wave}
          isOpen={isCreateCurationOpen}
          onClose={() => setIsCreateCurationOpen(false)}
          showSuccessToast={false}
          onSaved={handleCreatedFromCurate}
        />
      )}
    </MobileWrapperDialog>
  );
}
