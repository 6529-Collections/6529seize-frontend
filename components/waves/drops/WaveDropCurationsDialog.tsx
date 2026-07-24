"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/auth/Auth";
import MyStreamWaveCurationCreateDialog from "@/components/brain/my-stream/tabs/MyStreamWaveCurationCreateDialog";
import MobileWrapperDialog from "@/components/mobile-wrapper-dialog/MobileWrapperDialog";
import { Spinner } from "@/components/dotLoader/DotLoader";
import Button from "@/components/utils/button/Button";
import clsx from "clsx";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  type DropCurationMembership,
  useDropCurations,
} from "@/hooks/drops/useDropCurations";
import { useDropCurationMembershipMutation } from "@/hooks/drops/useDropCurationMembershipMutation";
import type { ApiWaveCuration } from "@/generated/models/ApiWaveCuration";
import type { ApiWaveMin } from "@/generated/models/ApiWaveMin";

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (typeof error === "string" && error.trim().length > 0) {
    return error;
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return fallback;
};

const isPermissionErrorMessage = (message: string): boolean => {
  const normalizedMessage = message.toLowerCase();

  return (
    normalizedMessage.includes("permission") ||
    normalizedMessage.includes("forbidden") ||
    normalizedMessage.includes("not authorized") ||
    normalizedMessage.includes("not allowed") ||
    normalizedMessage.includes("cannot curate") ||
    normalizedMessage.includes("can't curate") ||
    normalizedMessage.includes("not a member")
  );
};

const CREATE_AND_ADD_PERMISSION_MESSAGE =
  "Curation created, but you can't add drops with that group.";
const CREATE_AND_ADD_FALLBACK_MESSAGE =
  "Curation created, but the drop could not be added. Please try again.";
const AUTO_CLOSE_DELAY_MS = 350;

const getCreateAndAddErrorMessage = (error: unknown): string => {
  const fallbackErrorMessage = "Failed to add drop to curation.";
  const errorMessage = getErrorMessage(error, fallbackErrorMessage);

  if (isPermissionErrorMessage(errorMessage)) {
    return CREATE_AND_ADD_PERMISSION_MESSAGE;
  }

  if (errorMessage === fallbackErrorMessage) {
    return CREATE_AND_ADD_FALLBACK_MESSAGE;
  }

  return `Curation created, but the drop could not be added: ${errorMessage}`;
};

const sortCurationsForDialog = (
  left: DropCurationMembership,
  right: DropCurationMembership
): number => {
  if (left.drop_included !== right.drop_included) {
    return Number(right.drop_included) - Number(left.drop_included);
  }

  return left.name.localeCompare(right.name);
};

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
    <Button
      type="button"
      disabled={disabled}
      loading={loading}
      onClick={onClick}
      variant={isAdd ? "primary" : "secondary"}
      size="xs"
      className="tw-min-w-[5.5rem]"
    >
      <span>{isAdd ? "Add" : "Remove"}</span>
    </Button>
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
  readonly onUpdateMembership: (
    action: "add" | "remove"
  ) => Promise<void> | void;
}) {
  const membershipAction = curation.drop_included ? "remove" : "add";

  return (
    <div
      className={clsx(
        "tw-group tw-relative tw-flex tw-h-16 tw-items-center tw-justify-between tw-gap-3 tw-overflow-hidden tw-rounded-lg tw-border tw-border-solid tw-transition-all tw-duration-300",
        curation.drop_included
          ? "tw-border-white/30 tw-bg-iron-800 tw-p-3.5 tw-shadow-[0_4px_15px_rgba(0,0,0,0.4)]"
          : "tw-border-white/[0.06] tw-bg-iron-950 tw-p-3.5 desktop-hover:hover:tw-border-white/10 desktop-hover:hover:tw-bg-iron-900/60"
      )}
    >
      <div className="tw-flex tw-min-w-0 tw-flex-1 tw-flex-nowrap tw-items-center tw-gap-2.5">
        <p
          className={clsx(
            "tw-mb-0 tw-min-w-0 tw-flex-shrink tw-truncate tw-text-md tw-font-semibold tw-leading-tight tw-transition-colors",
            curation.drop_included
              ? "tw-text-iron-50"
              : "tw-text-iron-200 desktop-hover:group-hover:tw-text-iron-50"
          )}
        >
          {curation.name}
        </p>
        <span
          className={clsx(
            "tw-flex tw-h-4 tw-w-4 tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-full tw-transition-opacity",
            curation.drop_included
              ? "tw-bg-white/15 tw-opacity-100"
              : "tw-opacity-0"
          )}
          aria-hidden="true"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className="tw-h-2.5 tw-w-2.5 tw-text-iron-100"
            stroke="currentColor"
            strokeWidth="4"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </span>
      </div>

      <MembershipActionButton
        action={membershipAction}
        disabled={disabled}
        loading={loading}
        onClick={() => onUpdateMembership(membershipAction)}
      />
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
  readonly wave: Pick<ApiWaveMin, "id" | "admin_group_id">;
  readonly isOpen: boolean;
  readonly onClose: () => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { setToast } = useAuth();
  const [isCreateCurationOpen, setIsCreateCurationOpen] = useState(false);
  const autoCloseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const {
    data: curations = [],
    isLoading,
    isError,
    refetch,
  } = useDropCurations({
    dropId,
    enabled: isOpen,
  });
  const { updateMembershipAsync, isPending, pendingCurationId } =
    useDropCurationMembershipMutation({
      dropId,
    });

  const sortedCurations = useMemo(
    () =>
      curations
        .filter((curation) => curation.authenticated_user_can_curate === true)
        .sort(sortCurationsForDialog),
    [curations]
  );
  const hasVisibleCurations = sortedCurations.length > 0;
  const hasHiddenCurations = curations.length > 0 && !hasVisibleCurations;
  const isFirstCurationEmptyState =
    !isLoading && !isError && !hasHiddenCurations && !hasVisibleCurations;
  const emptyStateTitle = hasHiddenCurations
    ? "No curations you can manage"
    : "No curations yet";
  const emptyStateDescription = hasHiddenCurations
    ? "Create a new curation for this wave and add this drop to it."
    : "Create the first curation for this wave and add this drop to it.";
  const handleRetry = async () => {
    await refetch();
  };

  const navigateToCuration = (curationId: string) => {
    const params = new URLSearchParams(searchParams.toString() || "");
    params.set("curation", curationId);
    const nextQuery = params.toString();
    const nextUrl = nextQuery ? `${pathname}?${nextQuery}` : pathname;
    router.replace(nextUrl, { scroll: false });
  };

  const clearAutoCloseTimeout = () => {
    if (autoCloseTimeoutRef.current) {
      clearTimeout(autoCloseTimeoutRef.current);
      autoCloseTimeoutRef.current = null;
    }
  };

  const scheduleAutoClose = () => {
    clearAutoCloseTimeout();
    autoCloseTimeoutRef.current = globalThis.setTimeout(() => {
      autoCloseTimeoutRef.current = null;
      setIsCreateCurationOpen(false);
      onClose();
    }, AUTO_CLOSE_DELAY_MS);
  };

  useEffect(
    () => () => {
      clearAutoCloseTimeout();
    },
    []
  );

  const handleClose = () => {
    clearAutoCloseTimeout();
    setIsCreateCurationOpen(false);
    onClose();
  };

  const handleUpdateMembership = async (
    curationId: string,
    action: "add" | "remove"
  ) => {
    try {
      await updateMembershipAsync(curationId, action);
      scheduleAutoClose();
    } catch {
      clearAutoCloseTimeout();
    }
  };

  const handleCreatedFromCurate = async (curation: ApiWaveCuration) => {
    const refreshResult = await refetch();
    const createdCuration = refreshResult.isError
      ? undefined
      : refreshResult.data?.find((item) => item.id === curation.id);

    if (createdCuration?.authenticated_user_can_curate === false) {
      setToast({
        type: "warning",
        message: CREATE_AND_ADD_PERMISSION_MESSAGE,
      });
      return;
    }

    try {
      await updateMembershipAsync(curation.id, "add", {
        suppressToast: true,
      });
      setToast({
        type: "success",
        message: "Curation created and drop added.",
      });
      handleClose();
      navigateToCuration(curation.id);
    } catch (error) {
      setToast({
        type: "error",
        message: getCreateAndAddErrorMessage(error),
      });
    }
  };

  return (
    <MobileWrapperDialog
      title="Curate"
      isOpen={isOpen}
      onClose={handleClose}
      noPadding
      tabletModal={true}
      tall={true}
      maxWidthClass="md:tw-max-w-lg"
      headerClassName="tw-mb-4 tw-border-b tw-border-solid tw-border-x-0 tw-border-t-0 tw-border-iron-800 tw-pb-3 tw-pt-6"
      mobileCloseButtonClassName="-tw-translate-x-0.5 tw-translate-y-2 tw-z-10 tw-bg-transparent tw-text-white tw-shadow-lg"
    >
      <div className="tw-flex tw-min-h-0 tw-flex-1 tw-flex-col tw-pb-2">
        <div className="tw-min-h-0 tw-flex-1 tw-overflow-y-auto tw-scrollbar-thin tw-scrollbar-track-iron-800 tw-scrollbar-thumb-iron-500 desktop-hover:hover:tw-scrollbar-thumb-iron-300">
          <div className="tw-flex tw-flex-col tw-gap-6 tw-px-4 tw-pb-6 sm:tw-px-6">
            {!isFirstCurationEmptyState && (
              <div className="tw-flex tw-flex-col tw-gap-4 tw-pt-2 sm:tw-flex-row sm:tw-items-center sm:tw-justify-between">
                <p className="tw-mb-0 tw-text-sm tw-text-iron-400 sm:tw-flex-1 sm:tw-pr-4">
                  Add or remove this drop from curations in this wave.
                </p>
                {hasVisibleCurations && (
                  <div className="tw-flex tw-flex-shrink-0">
                    <Button
                      onClick={() => setIsCreateCurationOpen(true)}
                      variant="secondary"
                      size="xs"
                    >
                      Create and add curation
                    </Button>
                  </div>
                )}
              </div>
            )}

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
                  <Button onClick={handleRetry} variant="tertiary" size="xs">
                    Try again
                  </Button>
                </div>
              </div>
            )}

            {!isLoading && !isError && sortedCurations.length === 0 && (
              <div className="tw-rounded-2xl tw-border tw-border-solid tw-border-white/[0.06] tw-bg-iron-900 tw-p-8 tw-text-center tw-shadow-sm">
                <p className="tw-mb-2 tw-text-base tw-font-semibold tw-text-iron-100">
                  {emptyStateTitle}
                </p>
                <p className="tw-mx-auto tw-mb-6 tw-max-w-sm tw-text-sm tw-text-iron-400">
                  {emptyStateDescription}
                </p>
                <div className="tw-flex tw-justify-center">
                  <Button
                    onClick={() => setIsCreateCurationOpen(true)}
                    variant="primary"
                    size="sm"
                    className="tw-px-4"
                  >
                    Create first curation
                  </Button>
                </div>
              </div>
            )}

            {!isLoading && !isError && sortedCurations.length > 0 && (
              <div className="tw-flex tw-flex-col tw-gap-2">
                {sortedCurations.map((curation) => (
                  <CurationMembershipRow
                    key={curation.id}
                    curation={curation}
                    disabled={isPending}
                    loading={pendingCurationId === curation.id}
                    onUpdateMembership={async (action) =>
                      await handleUpdateMembership(curation.id, action)
                    }
                  />
                ))}
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
