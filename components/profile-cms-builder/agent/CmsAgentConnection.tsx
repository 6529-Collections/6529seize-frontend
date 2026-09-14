import { useState } from "react";
import { t } from "@/i18n/messages";
import type { SupportedLocale } from "@/i18n/locales";
import type {
  CmsAgentGrant,
  CmsAgentProposal,
  CmsAgentProposalSummary,
} from "@/lib/profile-cms/builder/agent-api";
import { formatDate } from "@/i18n/format";
import {
  StudioButton,
  StudioField,
  StudioSelect,
  STUDIO_CONTROL_CLASS,
} from "../studio/StudioControls";
import CmsAgentDocumentReviewPanel from "./CmsAgentDocumentReview";
import { useCmsAgentConnection } from "./useCmsAgentConnection";

export default function CmsAgentConnection({
  draftId,
  profileId,
  canUseBuilderApi,
  dirty,
  saveBlocked,
  locale,
  onSaveProposal,
}: {
  readonly draftId: string | undefined;
  readonly profileId: string | undefined;
  readonly canUseBuilderApi: boolean;
  readonly dirty: boolean;
  readonly saveBlocked: boolean;
  readonly locale: SupportedLocale;
  readonly onSaveProposal: (proposal: CmsAgentProposal) => Promise<void>;
}) {
  const connection = useCmsAgentConnection({
    draftId,
    profileId,
    enabled: canUseBuilderApi,
    locale,
  });
  const [label, setLabel] = useState("");
  const [duration, setDuration] = useState("3600");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const disabled = connection.working || saving;
  const needsSavedDraft = dirty || connection.base?.status !== "draft";
  const cannotSave = disabled || dirty || saveBlocked || !canUseBuilderApi;
  const save = async () => {
    if (!connection.selected || cannotSave) return;
    setSaving(true);
    setSaveError("");
    try {
      await onSaveProposal(connection.selected.proposal);
    } catch {
      setSaveError(t(locale, "profileCms.agent.saveFailed"));
    } finally {
      setSaving(false);
    }
  };
  return (
    <section className="tw-space-y-5 tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-bg-black tw-p-4 sm:tw-p-6">
      <header>
        <h3 className="tw-text-lg tw-font-semibold tw-text-white">
          {t(locale, "profileCms.agent.connectTitle")}
        </h3>
        <p className="tw-mb-0 tw-mt-2 tw-max-w-3xl tw-text-sm tw-leading-6 tw-text-iron-400">
          {t(locale, "profileCms.agent.connectHelp")}
        </p>
      </header>
      {!canUseBuilderApi || !draftId ? (
        <p className="tw-mb-0 tw-text-sm tw-leading-6 tw-text-iron-300">
          {t(locale, "profileCms.agent.saveFirst")}
        </p>
      ) : (
        <>
          {needsSavedDraft ? (
            <p className="tw-mb-0 tw-text-sm tw-leading-6 tw-text-iron-300">
              {t(locale, "profileCms.agent.saveFirst")}
            </p>
          ) : null}
          <fieldset
            disabled={disabled || needsSavedDraft}
            className="tw-m-0 tw-grid tw-min-w-0 tw-gap-4 tw-border-0 tw-p-0 sm:tw-grid-cols-[minmax(0,1fr)_auto_auto]"
          >
            <StudioField
              label={t(locale, "profileCms.agent.connectionName")}
              value={label}
              onChange={setLabel}
              maxLength={80}
            />
            <StudioSelect
              label={t(locale, "profileCms.agent.expires")}
              value={duration}
              onChange={setDuration}
              options={[
                { value: "3600", label: t(locale, "profileCms.agent.oneHour") },
                {
                  value: "14400",
                  label: t(locale, "profileCms.agent.fourHours"),
                },
                { value: "86400", label: t(locale, "profileCms.agent.oneDay") },
              ]}
            />
            <div className="tw-flex tw-items-end">
              <StudioButton
                primary
                disabled={!label.trim()}
                onClick={() =>
                  void connection.issue(label.trim(), Number(duration))
                }
              >
                {t(locale, "profileCms.agent.createKey")}
              </StudioButton>
            </div>
          </fieldset>
          {connection.token ? (
            <TokenPanel
              token={connection.token}
              locale={locale}
              onDismiss={connection.clearToken}
            />
          ) : null}
          <div className="tw-flex tw-flex-wrap tw-gap-4 tw-text-sm">
            <a
              href="/profile-cms/agent/v1/6529-cms-agent.zip"
              download
              className="hover:tw-text-primary-200 tw-text-primary-300"
            >
              {t(locale, "profileCms.agent.downloadAdapter")}
            </a>
            <a
              href="/profile-cms/agent/v1/README.md"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:tw-text-primary-200 tw-text-primary-300"
            >
              {t(locale, "profileCms.agent.setupGuide")}
            </a>
          </div>
          <div className="tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-3">
            <h4 className="tw-mb-0 tw-text-base tw-font-semibold tw-text-iron-100">
              {t(locale, "profileCms.agent.activity")}
            </h4>
            <StudioButton
              disabled={disabled}
              onClick={() => void connection.load()}
            >
              {t(locale, "profileCms.agent.refresh")}
            </StudioButton>
          </div>
          {connection.working && (
            <p role="status" className="tw-text-sm tw-text-iron-300">
              {t(locale, "profileCms.agent.loading")}
            </p>
          )}
          <AgentGrantList
            grants={connection.grants}
            locale={locale}
            disabled={disabled}
            onRevoke={(id) => void connection.revoke(id)}
          />
          <h4 className="tw-text-base tw-font-semibold tw-text-iron-100">
            {t(locale, "profileCms.agent.proposals")}
          </h4>
          {connection.proposals.length === 0 && !connection.working ? (
            <p className="tw-text-sm tw-leading-6 tw-text-iron-400">
              {t(locale, "profileCms.agent.noProposals")}
            </p>
          ) : null}
          <AgentProposalList
            proposals={connection.proposals}
            locale={locale}
            disabled={disabled}
            onReview={(id) => void connection.review(id)}
            onReject={(proposal) => void connection.reject(proposal)}
          />
          {connection.hasMore ? (
            <StudioButton
              disabled={disabled}
              onClick={() => void connection.load(true)}
            >
              {t(locale, "profileCms.agent.more")}
            </StudioButton>
          ) : null}
          {connection.selected && connection.base ? (
            <CmsAgentDocumentReviewPanel
              base={connection.base.cmsPackage}
              review={connection.selected.review}
              locale={locale}
              disabled={
                cannotSave || connection.selected.proposal.status !== "pending"
              }
              acceptLabel={t(locale, "profileCms.agent.saveProposal")}
              onAccept={() => void save()}
              onDismiss={connection.closeReview}
            />
          ) : null}
        </>
      )}
      {connection.error || saveError ? (
        <p role="alert" className="tw-mb-0 tw-text-sm tw-leading-6 tw-text-red">
          {saveError || connection.error}
        </p>
      ) : null}
    </section>
  );
}

function AgentProposalList({
  proposals,
  locale,
  disabled,
  onReview,
  onReject,
}: {
  readonly proposals: readonly CmsAgentProposalSummary[];
  readonly locale: SupportedLocale;
  readonly disabled: boolean;
  readonly onReview: (id: string) => void;
  readonly onReject: (proposal: CmsAgentProposalSummary) => void;
}) {
  return (
    <ul className="tw-m-0 tw-list-none tw-space-y-3 tw-p-0">
      {proposals.map((proposal) => (
        <li
          key={proposal.id}
          className="tw-space-y-3 tw-rounded-lg tw-border tw-border-solid tw-border-iron-800 tw-p-3"
        >
          <p className="tw-mb-0 tw-whitespace-pre-wrap tw-break-words tw-text-sm tw-leading-6 tw-text-iron-200">
            {proposal.summary}
          </p>
          <p className="tw-mb-0 tw-text-xs tw-text-iron-400">
            {formatDate(locale, proposal.created_at, {
              dateStyle: "medium",
              timeStyle: "short",
            })}{" "}
            · {t(locale, `profileCms.agent.status.${proposal.status}`)}
          </p>
          <div className="tw-flex tw-flex-wrap tw-gap-2">
            <StudioButton
              disabled={disabled}
              onClick={() => onReview(proposal.id)}
            >
              {t(locale, "profileCms.agent.review")}
            </StudioButton>
            {proposal.status === "pending" ? (
              <StudioButton
                disabled={disabled}
                onClick={() => onReject(proposal)}
              >
                {t(locale, "profileCms.agent.reject")}
              </StudioButton>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  );
}

function AgentGrantList({
  grants,
  locale,
  disabled,
  onRevoke,
}: {
  readonly grants: readonly CmsAgentGrant[];
  readonly locale: SupportedLocale;
  readonly disabled: boolean;
  readonly onRevoke: (id: string) => void;
}) {
  return (
    <ul className="tw-m-0 tw-list-none tw-space-y-3 tw-p-0">
      {grants.map((grant) => (
        <li
          key={grant.id}
          className="tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-3 tw-rounded-lg tw-border tw-border-solid tw-border-iron-800 tw-p-3"
        >
          <div className="tw-min-w-0">
            <p className="tw-mb-1 tw-break-words tw-text-sm tw-font-medium tw-text-iron-100">
              {grant.label}
            </p>
            <p className="tw-mb-0 tw-text-xs tw-leading-5 tw-text-iron-400">
              {grant.revoked_at === null
                ? t(locale, "profileCms.agent.expiresAt", {
                    date: formatDate(locale, grant.expires_at, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }),
                  })
                : t(locale, "profileCms.agent.revoked")}
            </p>
          </div>
          {grant.revoked_at === null ? (
            <StudioButton
              disabled={disabled}
              onClick={() => onRevoke(grant.id)}
            >
              {t(locale, "profileCms.agent.revoke")}
            </StudioButton>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

function TokenPanel({
  token,
  locale,
  onDismiss,
}: {
  readonly token: string;
  readonly locale: SupportedLocale;
  readonly onDismiss: () => void;
}) {
  const [visible, setVisible] = useState(false);
  const [status, setStatus] = useState("");
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(token);
      setStatus(t(locale, "profileCms.agent.copied"));
    } catch {
      setStatus(t(locale, "profileCms.agent.copyFailed"));
    }
  };
  return (
    <section className="tw-space-y-3 tw-rounded-lg tw-border tw-border-solid tw-border-primary-500/50 tw-bg-primary-500/5 tw-p-4">
      <label className="tw-block tw-space-y-2">
        <span className="tw-text-sm tw-font-medium tw-text-iron-100">
          {t(locale, "profileCms.agent.accessKey")}
        </span>
        <input
          className={`${STUDIO_CONTROL_CLASS} tw-font-mono`}
          type={visible ? "text" : "password"}
          value={token}
          readOnly
          autoComplete="off"
          spellCheck={false}
          data-private="true"
        />
      </label>
      <p className="tw-mb-0 tw-text-sm tw-leading-6 tw-text-iron-300">
        {t(locale, "profileCms.agent.keyHelp")}
      </p>
      <div className="tw-flex tw-flex-wrap tw-gap-2">
        <StudioButton onClick={() => void copy()}>
          {t(locale, "profileCms.agent.copyKey")}
        </StudioButton>
        <StudioButton
          active={visible}
          onClick={() => setVisible((value) => !value)}
        >
          {t(
            locale,
            visible ? "profileCms.agent.hideKey" : "profileCms.agent.showKey"
          )}
        </StudioButton>
        <StudioButton onClick={onDismiss}>
          {t(locale, "profileCms.agent.dismissKey")}
        </StudioButton>
      </div>
      {status ? (
        <p role="status" className="tw-mb-0 tw-text-xs tw-text-iron-300">
          {status}
        </p>
      ) : null}
    </section>
  );
}
