"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { formatInteger, formatDate } from "@/i18n/format";
import { t } from "@/i18n/messages";
import type { SupportedLocale } from "@/i18n/locales";
import {
  listProfileCmsPackagesForProfile,
  rollbackProfileCmsPackage,
  unpublishProfileCmsPackage,
  type ProfileCmsPackageRecord,
} from "@/lib/profile-cms/builder/api";
import { BuilderActionButton } from "./ProfileCmsBuilderControls";
import ProfileCmsRecoveryLink from "./ProfileCmsRecoveryLink";

export default function ProfileCmsVersionHistoryPanel({
  profileId,
  enabled,
  refreshToken,
  locale,
  busy,
  onLoad,
  onChanged,
}: {
  readonly profileId: string;
  readonly enabled: boolean;
  readonly refreshToken: number;
  readonly locale: SupportedLocale;
  readonly busy: boolean;
  readonly onLoad: (id: string) => void;
  readonly onChanged: () => void;
}) {
  const [revision, setRevision] = useState(0);
  const [mutationFailed, setFailed] = useState(false);
  const [working, setWorking] = useState(false);
  const [changed, setChanged] = useState(false);
  const [confirmation, setConfirmation] = useState<{
    record: ProfileCmsPackageRecord;
    action: "restore" | "unpublish";
    primary: ProfileCmsPackageRecord | undefined;
  } | null>(null);
  const history = useQuery({
    queryKey: [
      QueryKey.PROFILE,
      profileId,
      "cms-versions",
      refreshToken,
      revision,
    ],
    queryFn: () => listProfileCmsPackagesForProfile(profileId),
    enabled,
    staleTime: 0,
    gcTime: 0,
  });
  const records = enabled ? (history.data ?? []) : [];
  const loading = history.isFetching;
  const primary = records.find((record) => record.isPrimary);
  const mutate = async () => {
    if (!confirmation || !enabled || working || busy) return;
    setWorking(true);
    setFailed(false);
    const expected = confirmation.primary;
    const request = {
      expected_current_package_id: expected?.id ?? null,
      ...(expected
        ? { expected_current_package_hash: expected.packageHash }
        : {}),
    };
    try {
      if (confirmation.action === "unpublish")
        await unpublishProfileCmsPackage(confirmation.record.id, {
          expected_current_package_id: confirmation.record.id,
          expected_current_package_hash: confirmation.record.packageHash,
        });
      else await rollbackProfileCmsPackage(confirmation.record.id, request);
      setConfirmation(null);
      setChanged(true);
      setRevision((value) => value + 1);
      onChanged();
    } catch {
      setFailed(true);
    } finally {
      setWorking(false);
    }
  };
  return (
    <section
      className="tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-900 tw-p-4"
      aria-busy={loading || working}
    >
      <h2 className="tw-text-base tw-font-semibold tw-text-white">
        {t(locale, "profileCms.builder.history.title")}
      </h2>
      {!enabled ? (
        <p>{t(locale, "profileCms.builder.history.unavailable")}</p>
      ) : null}
      <BuilderActionButton
        disabled={!enabled || loading || working || busy}
        label={t(locale, "profileCms.builder.history.refresh")}
        onClick={() => setRevision((value) => value + 1)}
      />
      {history.isError ? (
        <p role="alert">{t(locale, "profileCms.builder.history.failed")}</p>
      ) : null}
      {mutationFailed ? (
        <p role="alert">
          {t(locale, "profileCms.builder.history.actionFailed")}
        </p>
      ) : null}
      {changed ? (
        <p role="status">{t(locale, "profileCms.builder.history.changed")}</p>
      ) : null}
      {loading ? (
        <p role="status">{t(locale, "profileCms.builder.history.loading")}</p>
      ) : null}
      {enabled && !loading && !records.length ? (
        <p>{t(locale, "profileCms.builder.history.empty")}</p>
      ) : null}
      <ul className="tw-mt-3 tw-flex tw-flex-col tw-gap-3">
        {records.map((record) => (
          <li
            key={record.id}
            className="tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-p-3"
          >
            <p>
              {t(locale, "profileCms.builder.history.version", {
                version: formatInteger(locale, record.version),
              })}{" "}
              · {t(locale, statusKey(record.status))}
              {record.isPrimary
                ? ` · ${t(locale, "profileCms.builder.history.primary")}`
                : ""}
            </p>
            <time dateTime={record.updatedAt}>
              {formatDate(locale, new Date(record.updatedAt))}
            </time>
            <div className="tw-mt-2 tw-flex tw-flex-wrap tw-gap-2">
              <BuilderActionButton
                disabled={!enabled || working || busy}
                label={t(locale, "profileCms.builder.drafts.load")}
                onClick={() => onLoad(record.id)}
              />
              {record.isPrimary ? (
                <BuilderActionButton
                  disabled={!enabled || working || busy}
                  label={t(locale, "profileCms.builder.history.unpublish")}
                  onClick={() =>
                    setConfirmation({ record, action: "unpublish", primary })
                  }
                />
              ) : null}
              {record.publishedAt &&
              !record.isPrimary &&
              record.status !== "archived" ? (
                <BuilderActionButton
                  disabled={!enabled || working || busy}
                  label={t(locale, "profileCms.builder.history.rollback")}
                  onClick={() =>
                    setConfirmation({ record, action: "restore", primary })
                  }
                />
              ) : null}
            </div>
            <ProfileCmsRecoveryLink
              receipt={record.recoveryReceipt}
              locale={locale}
            />
          </li>
        ))}
      </ul>
      {confirmation ? (
        <div className="tw-mt-3 tw-rounded-lg tw-border tw-border-solid tw-border-primary-400 tw-p-3">
          <p>
            {t(
              locale,
              confirmation.action === "unpublish"
                ? "profileCms.builder.history.unpublishConfirm"
                : "profileCms.builder.history.confirm.body",
              { version: formatInteger(locale, confirmation.record.version) }
            )}
          </p>
          <div className="tw-mt-2 tw-flex tw-gap-2">
            <BuilderActionButton
              disabled={working || busy || !enabled}
              label={t(locale, "profileCms.builder.history.confirm.confirm")}
              onClick={() => void mutate()}
            />
            <BuilderActionButton
              disabled={working}
              label={t(locale, "profileCms.builder.history.confirm.cancel")}
              onClick={() => setConfirmation(null)}
            />
          </div>
        </div>
      ) : null}
    </section>
  );
}

function statusKey(
  status: ProfileCmsPackageRecord["status"]
): Parameters<typeof t>[1] {
  const keys = {
    draft: "profileCms.builder.drafts.status.draft",
    validating: "profileCms.builder.drafts.status.validating",
    published: "profileCms.builder.drafts.status.published",
    failed: "profileCms.builder.drafts.status.failed",
    archived: "profileCms.builder.drafts.status.archived",
    superseded: "profileCms.builder.drafts.status.superseded",
  } as const;
  return keys[status];
}
