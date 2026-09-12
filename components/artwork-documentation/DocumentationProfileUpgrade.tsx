"use client";

import { useState } from "react";
import type { ApiArtworkDocumentationContext } from "@/generated/models/ApiArtworkDocumentationContext";
import { ApiArtworkDocumentationContextLifecycleEnum } from "@/generated/models/ApiArtworkDocumentationContext";
import type { ApiArtworkDocumentationUpgradePreview } from "@/generated/models/ApiArtworkDocumentationUpgradePreview";
import type { DocumentationDraftController } from "@/lib/artwork-documentation/draft-controller";
import { mutationCapabilities } from "@/lib/artwork-documentation/capabilities";
import { isMuseumRecord } from "@/lib/artwork-documentation/catalogue";
import {
  previewDocumentationUpgrade,
  upgradeDocumentationProfile,
} from "@/services/api/artwork-documentation-api";
import {
  DocumentationButton,
  DocumentationNotice,
  useDocumentationMessages,
} from "./DocumentationControls";

function fieldLabel(
  preview: ApiArtworkDocumentationUpgradePreview,
  path: string
): string {
  const [moduleId, fieldId] = path.split(".");
  for (const profile of [preview.proposed_profile, preview.current_profile]) {
    const field = profile.modules
      .find((module) => module.id === moduleId)
      ?.fields.find((item) => item.id === fieldId);
    if (field?.label) return field.label;
  }
  return path.replaceAll("_", " ").replace(".", ": ");
}

/** Upgrading is a reviewed, version-checked change to this record; confirmed revisions stay untouched. */
export default function DocumentationProfileUpgrade({
  context,
  controller,
}: {
  readonly context: ApiArtworkDocumentationContext;
  readonly controller: DocumentationDraftController;
}) {
  const { msg } = useDocumentationMessages();
  const [preview, setPreview] = useState<{
    value: ApiArtworkDocumentationUpgradePreview;
    version: number;
  } | null>(null);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const [key] = useState(() => crypto.randomUUID());
  const permissions = mutationCapabilities(context);
  if (
    isMuseumRecord(context.profile) ||
    context.lifecycle !== ApiArtworkDocumentationContextLifecycleEnum.Active ||
    !permissions.manage_context
  )
    return null;
  const coordinatorNeeded =
    !!context.program_id &&
    permissions.confirm_as_artist &&
    context.profile.version >= 3;
  const currentPreview =
    preview?.version === context.draft_version ? preview.value : null;
  const blocks = currentPreview?.blocking_fields ?? [];
  const targetMatches =
    currentPreview?.proposed_profile.profile_id === "stream_artwork_basic_v1" &&
    currentPreview.proposed_profile.version === 3 &&
    currentPreview.proposed_profile.program_id === context.program_id;
  const load = async () => {
    setBusy(true);
    setFailed(false);
    try {
      if (!(await controller.flush())) return;
      const current = controller.snapshot().context;
      const value = await previewDocumentationUpgrade(current.id);
      setPreview({ value, version: current.draft_version });
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  };
  const apply = async () => {
    if (!currentPreview || blocks.length || coordinatorNeeded || !targetMatches)
      return;
    setBusy(true);
    setFailed(false);
    try {
      const result = await controller.mutate((current, signal) => {
        if (current.draft_version !== preview?.version)
          throw new Error("Upgrade preview is stale");
        return upgradeDocumentationProfile(current, key, signal);
      });
      if (!result) setFailed(true);
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  };
  return (
    <details className="tw-border-0 tw-border-y tw-border-solid tw-border-iron-800 tw-py-4">
      <summary className="tw-min-h-11 tw-cursor-pointer tw-py-3 tw-text-sm tw-text-iron-200">
        {msg("museum.upgrade")}
      </summary>
      <div className="tw-max-w-prose tw-space-y-5 tw-py-4">
        <p className="tw-text-sm tw-leading-7 tw-text-iron-400">
          {msg("museum.upgradeHelp")}
        </p>
        {coordinatorNeeded ? (
          <p className="tw-text-sm tw-leading-7 tw-text-iron-300">
            {msg("museum.upgradeCoordinator")}
          </p>
        ) : (
          <DocumentationButton
            secondary
            disabled={busy}
            onClick={() => {
              void load();
            }}
          >
            {msg("museum.upgradePreview")}
          </DocumentationButton>
        )}
        {currentPreview && (
          <div className="tw-space-y-5">
            {!targetMatches && (
              <DocumentationNotice error>
                {msg("museum.upgradeFailed")}
              </DocumentationNotice>
            )}
            <p className="tw-text-sm tw-leading-7">
              {msg("museum.upgradeRetained", {
                count: currentPreview.retained_fields?.length ?? 0,
              })}
            </p>
            {currentPreview.notices?.map((notice) => (
              <p
                key={notice}
                className="tw-text-sm tw-leading-7 tw-text-iron-300"
              >
                {notice}
              </p>
            ))}
            {!!blocks.length && (
              <DocumentationNotice error>
                <p>{msg("museum.upgradeBlocked")}</p>
                <ul>
                  {blocks.map((path) => (
                    <li key={path}>{fieldLabel(currentPreview, path)}</li>
                  ))}
                </ul>
              </DocumentationNotice>
            )}
            {!!currentPreview.added_required_fields.length && (
              <details>
                <summary className="tw-min-h-11 tw-cursor-pointer tw-py-3 tw-text-sm">
                  {msg("museum.upgradeNewFields")}
                </summary>
                <ul className="tw-text-sm tw-leading-7">
                  {currentPreview.added_required_fields.map((path) => (
                    <li key={path}>{fieldLabel(currentPreview, path)}</li>
                  ))}
                </ul>
              </details>
            )}
            {!blocks.length && targetMatches && !coordinatorNeeded && (
              <DocumentationButton
                disabled={busy}
                onClick={() => {
                  void apply();
                }}
              >
                {msg("museum.upgradeApply")}
              </DocumentationButton>
            )}
          </div>
        )}
        {failed && (
          <DocumentationNotice error>
            {msg("museum.upgradeFailed")}
          </DocumentationNotice>
        )}
      </div>
    </details>
  );
}
