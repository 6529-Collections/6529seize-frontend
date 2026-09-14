import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";

import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import type { CmsPackageV1, CmsAssetV1 } from "@/lib/profile-cms/protocol/v1";
import { applyCmsDocumentOperation } from "@/lib/profile-cms/studio/document";
import {
  CmsStudioImageUploadError,
  uploadCmsStudioImage,
  type CmsStudioImageUploadErrorCode,
  type CmsStudioImageUploadReference,
} from "@/lib/profile-cms/studio/image-upload";
import {
  StudioButton,
  StudioField,
  STUDIO_CONTROL_CLASS,
} from "./StudioControls";

interface StudioImageUploadProps {
  readonly document: CmsPackageV1;
  readonly locale: SupportedLocale;
  readonly canUpload: boolean;
  /** Include the owner wallet, profile and draft identity; changing scope clears retries. */
  readonly scopeKey: string;
  readonly onChange: (document: CmsPackageV1) => void;
  /** Memoize against the selected block. A changed callback never selects a late result. */
  readonly onAssetAdded?: (assetId: string) => void;
  readonly onBusyChange?: (busy: boolean) => void;
}

type UploadState = "idle" | "uploading" | "processing" | "verifying" | "added";

function ImageUploadForm(props: StudioImageUploadProps) {
  const { locale, canUpload } = props;
  const [file, setFile] = useState<File | undefined>();
  const [alt, setAlt] = useState("");
  const [rights, setRights] = useState("");
  const [state, setState] = useState<UploadState>("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<
    CmsStudioImageUploadErrorCode | "documentError" | null
  >(null);
  const [reference, setReference] = useState<CmsStudioImageUploadReference>();
  const inputId = useId();
  const fileInput = useRef<HTMLInputElement>(null);
  const pending = useRef<AbortController | null>(null);
  const latest = useRef(props);
  useLayoutEffect(() => {
    latest.current = props;
  });
  useEffect(
    () => () => {
      pending.current?.abort();
    },
    []
  );
  const busy =
    state === "uploading" || state === "processing" || state === "verifying";

  const completeUpload = (
    asset: CmsAssetV1,
    selected: StudioImageUploadProps["onAssetAdded"]
  ) => {
    const current = latest.current.document;
    const result = applyCmsDocumentOperation(
      current,
      current.integrity.package_hash,
      {
        type: "batch",
        operations: [{ type: "add_asset", asset }],
      }
    );
    if (!result.ok) {
      setError("documentError");
      setState("idle");
      return;
    }
    latest.current.onChange(result.document);
    if (selected === latest.current.onAssetAdded) selected?.(asset.id);
    setState("added");
    setReference(undefined);
    setFile(undefined);
    if (fileInput.current) fileInput.current.value = "";
  };

  const start = async () => {
    if (!canUpload || pending.current || !alt.trim() || (!file && !reference))
      return;
    const controller = new AbortController();
    pending.current = controller;
    latest.current.onBusyChange?.(true);
    const selected = props.onAssetAdded;
    setError(null);
    setState(reference ? "verifying" : "uploading");
    setProgress(0);
    try {
      const asset = await uploadCmsStudioImage({
        assetId: reference?.assetId ?? `asset-upload-${crypto.randomUUID()}`,
        ...(file ? { file } : {}),
        ...(reference ? { resume: reference } : {}),
        altText: alt,
        rights,
        signal: controller.signal,
        onProgress: setProgress,
        onState: setState,
        onReference: setReference,
      });
      if (controller.signal.aborted || !latest.current.canUpload) return;
      completeUpload(asset, selected);
    } catch (failure) {
      if (controller.signal.aborted) return;
      const code =
        failure instanceof CmsStudioImageUploadError
          ? failure.code
          : "upload_failed";
      if (failure instanceof CmsStudioImageUploadError && failure.reference)
        setReference(failure.reference);
      setError(code);
      setState("idle");
    } finally {
      if (pending.current === controller) {
        pending.current = null;
        latest.current.onBusyChange?.(false);
      }
    }
  };

  return (
    <section
      className="tw-min-w-0 tw-space-y-4"
      aria-labelledby={`${inputId}-title`}
    >
      <h3
        id={`${inputId}-title`}
        className="tw-m-0 tw-text-sm tw-font-semibold tw-text-iron-100"
      >
        {t(locale, "profileCmsStudioUpload.title")}
      </h3>
      <p
        id={`${inputId}-help`}
        className="tw-m-0 tw-text-xs tw-leading-5 tw-text-iron-300"
      >
        {t(locale, "profileCmsStudioUpload.publicHelp")}
      </p>
      {!canUpload && (
        <p className="tw-m-0 tw-text-sm tw-text-iron-300">
          {t(locale, "profileCmsStudioUpload.authRequired")}
        </p>
      )}
      <fieldset
        disabled={!canUpload || busy}
        className="tw-m-0 tw-min-w-0 tw-space-y-4 tw-border-0 tw-p-0"
      >
        <div className="tw-space-y-2">
          <label
            htmlFor={inputId}
            className="tw-block tw-text-xs tw-font-medium tw-text-iron-300"
          >
            {t(locale, "profileCmsStudioUpload.file")}
          </label>
          <input
            ref={fileInput}
            id={inputId}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            aria-describedby={`${inputId}-help`}
            className={STUDIO_CONTROL_CLASS}
            onChange={(event) => {
              setFile(event.target.files?.[0]);
              setReference(undefined);
              setError(null);
              setState("idle");
            }}
          />
        </div>
        <StudioField
          label={t(locale, "profileCmsStudioUpload.alt")}
          help={t(locale, "profileCmsStudioUpload.altHelp")}
          value={alt}
          onChange={setAlt}
          maxLength={2000}
        />
        <StudioField
          label={t(locale, "profileCmsStudioUpload.rights")}
          value={rights}
          onChange={setRights}
          maxLength={2000}
        />
      </fieldset>
      <div className="tw-flex tw-flex-wrap tw-gap-2">
        <StudioButton
          primary
          disabled={!canUpload || busy || !alt.trim() || (!file && !reference)}
          onClick={() => {
            void start();
          }}
        >
          {t(
            locale,
            reference
              ? "profileCmsStudioUpload.retry"
              : "profileCmsStudioUpload.upload"
          )}
        </StudioButton>
        {busy && (
          <StudioButton
            onClick={() => {
              pending.current?.abort();
              pending.current = null;
              latest.current.onBusyChange?.(false);
              setState("idle");
              setError("cancelled");
            }}
          >
            {t(locale, "profileCmsStudioUpload.cancel")}
          </StudioButton>
        )}
      </div>
      {busy && (
        <progress
          aria-label={t(locale, "profileCmsStudioUpload.progress")}
          max={1}
          value={state === "uploading" ? progress : undefined}
          className="tw-w-full tw-max-w-full"
        />
      )}
      <div
        role="status"
        aria-live="polite"
        className="tw-text-sm tw-leading-6 tw-text-iron-200"
      >
        {state !== "idle" ? t(locale, `profileCmsStudioUpload.${state}`) : ""}
      </div>
      {error && (
        <p
          role="alert"
          className="tw-text-red-300 tw-m-0 tw-text-sm tw-leading-6"
        >
          {t(locale, `profileCmsStudioUpload.${error}`)}
        </p>
      )}
    </section>
  );
}

export default function StudioImageUpload(props: StudioImageUploadProps) {
  return (
    <ImageUploadForm key={`${props.scopeKey}:${props.canUpload}`} {...props} />
  );
}
