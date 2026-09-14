import { useRef, useState, type ChangeEvent } from "react";
import { t } from "@/i18n/messages";
import type { SupportedLocale } from "@/i18n/locales";
import { createCmsAgentKit } from "@/lib/profile-cms/agent-kit";
import {
  CMS_AGENT_FILE_MAX_BYTES,
  CmsAgentReviewError,
  reviewCmsAgentFile,
  type CmsAgentDocumentReview,
} from "@/lib/profile-cms/agent-review";
import type { CmsPackageV1 } from "@/lib/profile-cms/protocol/v1";
import type { CmsBuilderValidation } from "@/lib/profile-cms/builder/package";
import type { CmsAgentProposal } from "@/lib/profile-cms/builder/agent-api";
import {
  ProfileCmsAgentPanel,
  downloadJsonFile,
} from "../ProfileCmsAgentPanel";
import { StudioButton } from "../studio/StudioControls";
import CmsAgentDocumentReviewPanel from "./CmsAgentDocumentReview";
import CmsAgentConnection from "./CmsAgentConnection";

export default function ProfileCmsAgentWorkspace({
  canUseBuilderApi,
  currentDraftVersion,
  draftId,
  locale,
  onApplyPackage,
  onSaveProposal,
  profileId,
  validation,
  dirty,
  hasUnappliedJson,
  saveBlocked,
}: {
  readonly canUseBuilderApi: boolean;
  readonly currentDraftVersion: number;
  readonly draftId?: string | undefined;
  readonly locale: SupportedLocale;
  readonly onApplyPackage: (cmsPackage: CmsPackageV1) => void;
  readonly onSaveProposal: (proposal: CmsAgentProposal) => Promise<void>;
  readonly profileId?: string | undefined;
  readonly validation: CmsBuilderValidation;
  readonly dirty: boolean;
  readonly hasUnappliedJson: boolean;
  readonly saveBlocked: boolean;
}) {
  return (
    <div className="tw-space-y-6 tw-p-4 sm:tw-p-6">
      <header>
        <h2 className="tw-text-xl tw-font-semibold tw-text-white">
          {t(locale, "profileCms.agent.title")}
        </h2>
        <p className="tw-mb-0 tw-mt-2 tw-max-w-3xl tw-text-sm tw-leading-6 tw-text-iron-300">
          {t(locale, "profileCms.agent.description")}
        </p>
      </header>
      <ManualExchange
        key={validation.cmsPackage.integrity.package_hash}
        cmsPackage={validation.cmsPackage}
        locale={locale}
        onApply={onApplyPackage}
        disabled={hasUnappliedJson}
      />
      <CmsAgentConnection
        key={`${profileId ?? "guest"}:${draftId ?? "unsaved"}`}
        profileId={profileId}
        draftId={draftId}
        canUseBuilderApi={canUseBuilderApi}
        dirty={dirty}
        saveBlocked={saveBlocked}
        locale={locale}
        onSaveProposal={onSaveProposal}
      />
      <details className="tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-p-4">
        <summary className="tw-cursor-pointer tw-text-sm tw-font-medium tw-text-iron-300">
          {t(locale, "profileCms.agent.advanced")}
        </summary>
        <p className="tw-mt-3 tw-text-sm tw-leading-6 tw-text-iron-400">
          {t(locale, "profileCms.agent.legacyHelp")}
        </p>
        <fieldset
          disabled={hasUnappliedJson}
          className="tw-m-0 tw-min-w-0 tw-border-0 tw-p-0"
        >
          <ProfileCmsAgentPanel
            canUseBuilderApi={canUseBuilderApi}
            currentDraftVersion={currentDraftVersion}
            draftId={draftId}
            locale={locale}
            onApplyPackage={onApplyPackage}
            profileId={profileId}
            validation={validation}
          />
        </fieldset>
      </details>
    </div>
  );
}

function ManualExchange({
  cmsPackage,
  locale,
  onApply,
  disabled,
}: {
  readonly cmsPackage: CmsPackageV1;
  readonly locale: SupportedLocale;
  readonly onApply: (candidate: CmsPackageV1) => void;
  readonly disabled: boolean;
}) {
  const [review, setReview] = useState<CmsAgentDocumentReview | null>(null);
  const [error, setError] = useState("");
  const [reading, setReading] = useState(false);
  const requestId = useRef(0);
  const readFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const file = input.files?.[0];
    input.value = "";
    if (!file) return;
    const id = ++requestId.current;
    setError("");
    setReview(null);
    setReading(true);
    try {
      if (file.size > CMS_AGENT_FILE_MAX_BYTES)
        throw new CmsAgentReviewError("too_large");
      const json = await file.text();
      if (id === requestId.current)
        setReview(reviewCmsAgentFile(cmsPackage, json));
    } catch (failure) {
      if (id === requestId.current)
        setError(
          failure instanceof CmsAgentReviewError &&
            failure.code === "stale_base"
            ? t(locale, "profileCms.agent.stale")
            : t(locale, "profileCms.agent.invalidFile")
        );
    } finally {
      if (id === requestId.current) setReading(false);
    }
  };
  return (
    <section className="tw-space-y-4 tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-bg-black tw-p-4 sm:tw-p-6">
      <div>
        <h3 className="tw-text-lg tw-font-semibold tw-text-white">
          {t(locale, "profileCms.agent.fileTitle")}
        </h3>
        <p className="tw-mb-0 tw-mt-2 tw-text-sm tw-leading-6 tw-text-iron-400">
          {t(locale, "profileCms.agent.fileHelp")}
        </p>
      </div>
      <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-3">
        <StudioButton
          onClick={() =>
            downloadJsonFile(
              `${cmsPackage.profile.handle}-website-agent-kit.json`,
              createCmsAgentKit(cmsPackage)
            )
          }
        >
          {t(locale, "profileCms.agent.downloadKit")}
        </StudioButton>
        <label className="tw-flex tw-min-h-10 tw-cursor-pointer tw-items-center tw-gap-3 tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-px-3 tw-py-2 tw-text-sm tw-font-medium tw-text-iron-100 focus-within:tw-outline focus-within:tw-outline-2 focus-within:tw-outline-primary-400">
          {t(locale, "profileCms.agent.uploadProposal")}
          <input
            className="tw-sr-only"
            type="file"
            accept="application/json,.json"
            disabled={reading}
            onChange={(event) => void readFile(event)}
          />
        </label>
      </div>
      {reading ? (
        <p role="status" className="tw-text-sm tw-text-iron-300">
          {t(locale, "profileCms.agent.loading")}
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="tw-text-sm tw-text-red">
          {error}
        </p>
      ) : null}
      {review ? (
        <CmsAgentDocumentReviewPanel
          base={cmsPackage}
          review={review}
          locale={locale}
          disabled={disabled}
          acceptLabel={t(locale, "profileCms.agent.useDraft")}
          onAccept={() => {
            onApply(review.cmsPackage);
            setReview(null);
          }}
          onDismiss={() => setReview(null)}
        />
      ) : null}
    </section>
  );
}
