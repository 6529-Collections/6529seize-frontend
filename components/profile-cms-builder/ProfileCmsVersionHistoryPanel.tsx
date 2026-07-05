"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { formatInteger } from "@/i18n/format";
import { DEFAULT_LOCALE, type SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import {
  listProfileCmsPackagesForProfile,
  rollbackProfileCmsPackage,
  type ProfileCmsPackageRecord,
} from "@/lib/profile-cms/builder/api";

type ListStatus = "idle" | "loading" | "ready" | "error";
type RollbackStatus = "idle" | "working" | "error" | "done";

type ProfileCmsVersionHistoryPanelProps = {
  readonly profileId: string | undefined;
  readonly canUseBuilderApi: boolean;
  readonly builderApiEnabled: boolean;
  readonly locale?: SupportedLocale | undefined;
  // Bumped by the parent after a successful publish so the list refreshes.
  readonly refreshToken?: number | undefined;
};

export default function ProfileCmsVersionHistoryPanel({
  profileId,
  canUseBuilderApi,
  builderApiEnabled,
  locale = DEFAULT_LOCALE,
  refreshToken = 0,
}: ProfileCmsVersionHistoryPanelProps) {
  const [status, setStatus] = useState<ListStatus>("idle");
  const [packages, setPackages] = useState<readonly ProfileCmsPackageRecord[]>(
    []
  );
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [rollbackStatus, setRollbackStatus] = useState<RollbackStatus>("idle");
  const [rollbackError, setRollbackError] = useState("");
  const requestIdRef = useRef(0);

  const canRequest = canUseBuilderApi && builderApiEnabled && !!profileId;

  const loadPackages = useCallback(async () => {
    if (!profileId || !canRequest) {
      return;
    }
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setStatus("loading");
    try {
      const records = await listProfileCmsPackagesForProfile(profileId);
      if (requestId !== requestIdRef.current) {
        return;
      }
      setPackages(records);
      setStatus("ready");
    } catch {
      if (requestId !== requestIdRef.current) {
        return;
      }
      setStatus("error");
    }
  }, [canRequest, profileId]);

  useEffect(() => {
    if (refreshToken > 0 && canRequest) {
      void loadPackages();
    }
  }, [refreshToken, canRequest, loadPackages]);

  const primary = packages.find((record) => record.status === "published");
  const rollbackTargets = packages.filter(
    (record) =>
      (record.status === "published" || record.status === "superseded") &&
      record.id !== primary?.id
  );

  const confirmRollback = async (target: ProfileCmsPackageRecord) => {
    if (!primary) {
      return;
    }
    setRollbackStatus("working");
    setRollbackError("");
    try {
      await rollbackProfileCmsPackage(target.id, {
        expected_current_package_id: primary.packageId,
        expected_current_package_hash: primary.packageHash,
      });
      setConfirmingId(null);
      setRollbackStatus("done");
      await loadPackages();
    } catch (error) {
      setRollbackStatus("error");
      setRollbackError(getErrorMessage(error));
    }
  };

  return (
    <section className="tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-900 tw-p-4">
      <div className="tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-2">
        <h2 className="tw-text-base tw-font-semibold tw-text-white">
          {t(locale, "profileCms.builder.history.title")}
        </h2>
        <button
          className="tw-min-h-10 tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-950 tw-px-3 tw-text-sm tw-font-semibold tw-text-iron-100 hover:tw-border-primary-400 disabled:tw-cursor-not-allowed disabled:tw-opacity-50"
          disabled={!canRequest || status === "loading"}
          onClick={() => void loadPackages()}
          type="button"
        >
          {status === "loading"
            ? t(locale, "profileCms.builder.history.loading")
            : t(locale, "profileCms.builder.history.refresh")}
        </button>
      </div>

      {!canRequest ? (
        <p className="tw-mt-3 tw-text-sm tw-leading-6 tw-text-iron-400">
          {t(locale, "profileCms.builder.history.unavailable")}
        </p>
      ) : null}

      {canRequest && status === "error" ? (
        <p
          className="tw-mt-3 tw-border tw-border-solid tw-border-red tw-bg-red/10 tw-p-3 tw-text-sm tw-text-red"
          role="alert"
        >
          {t(locale, "profileCms.builder.history.failed")}
        </p>
      ) : null}

      {canRequest && status === "ready" && !packages.length ? (
        <p className="tw-mt-3 tw-text-sm tw-leading-6 tw-text-iron-400">
          {t(locale, "profileCms.builder.history.empty")}
        </p>
      ) : null}

      {packages.length ? (
        <ul className="tw-mt-3 tw-flex tw-flex-col tw-gap-2">
          {packages.map((record) => {
            const isPrimary = record.id === primary?.id;
            const canRollback = rollbackTargets.some(
              (target) => target.id === record.id
            );
            return (
              <li
                className="tw-flex tw-flex-col tw-gap-2 tw-border tw-border-solid tw-border-iron-700 tw-bg-black tw-p-3"
                key={record.id}
              >
                <div className="tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-2">
                  <div className="tw-min-w-0">
                    <p className="tw-truncate tw-text-sm tw-font-semibold tw-text-white">
                      {t(locale, "profileCms.builder.history.version", {
                        version: formatInteger(locale, record.version),
                      })}{" "}
                      · {t(locale, getStatusLabelKey(record.status))}
                      {isPrimary
                        ? ` · ${t(locale, "profileCms.builder.history.primary")}`
                        : ""}
                    </p>
                    <p className="tw-mt-1 tw-truncate tw-font-mono tw-text-xs tw-text-iron-500">
                      {record.packageHash}
                    </p>
                  </div>
                  {canRollback ? (
                    <button
                      className="tw-min-h-9 tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-950 tw-px-3 tw-text-sm tw-text-iron-100 hover:tw-border-primary-400 disabled:tw-cursor-not-allowed disabled:tw-opacity-50"
                      disabled={rollbackStatus === "working"}
                      onClick={() => setConfirmingId(record.id)}
                      type="button"
                    >
                      {t(locale, "profileCms.builder.history.rollback")}
                    </button>
                  ) : null}
                </div>

                {confirmingId === record.id ? (
                  <div
                    className="tw-border tw-border-solid tw-border-primary-400 tw-bg-primary-500/10 tw-p-3"
                    role="alertdialog"
                    aria-label={t(
                      locale,
                      "profileCms.builder.history.confirm.title"
                    )}
                  >
                    <p className="tw-text-sm tw-leading-6 tw-text-iron-100">
                      {t(locale, "profileCms.builder.history.confirm.body", {
                        version: formatInteger(locale, record.version),
                      })}
                    </p>
                    <div className="tw-mt-3 tw-flex tw-flex-wrap tw-gap-2">
                      <button
                        className="tw-min-h-9 tw-border tw-border-solid tw-border-primary-400 tw-bg-primary-500 tw-px-3 tw-text-sm tw-font-semibold tw-text-white disabled:tw-cursor-not-allowed disabled:tw-opacity-50"
                        disabled={rollbackStatus === "working"}
                        onClick={() => void confirmRollback(record)}
                        type="button"
                      >
                        {rollbackStatus === "working"
                          ? t(
                              locale,
                              "profileCms.builder.history.confirm.working"
                            )
                          : t(
                              locale,
                              "profileCms.builder.history.confirm.confirm"
                            )}
                      </button>
                      <button
                        className="tw-min-h-9 tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-950 tw-px-3 tw-text-sm tw-text-iron-100 hover:tw-border-primary-400 disabled:tw-cursor-not-allowed disabled:tw-opacity-50"
                        disabled={rollbackStatus === "working"}
                        onClick={() => setConfirmingId(null)}
                        type="button"
                      >
                        {t(locale, "profileCms.builder.history.confirm.cancel")}
                      </button>
                    </div>
                    {rollbackStatus === "error" ? (
                      <p
                        className="tw-mt-2 tw-break-words tw-text-xs tw-leading-5 tw-text-red"
                        role="alert"
                      >
                        {rollbackError ||
                          t(
                            locale,
                            "profileCms.builder.history.rollbackFailed"
                          )}
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : null}
    </section>
  );
}

function getStatusLabelKey(
  status: ProfileCmsPackageRecord["status"]
): Parameters<typeof t>[1] {
  switch (status) {
    case "draft":
      return "profileCms.builder.drafts.status.draft";
    case "validating":
      return "profileCms.builder.drafts.status.validating";
    case "published":
      return "profileCms.builder.drafts.status.published";
    case "failed":
      return "profileCms.builder.drafts.status.failed";
    case "archived":
      return "profileCms.builder.drafts.status.archived";
    case "superseded":
      return "profileCms.builder.drafts.status.superseded";
    default:
      return "profileCms.builder.drafts.status.draft";
  }
}

function getErrorMessage(error: unknown): string {
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string") {
      return message;
    }
  }
  return "";
}
