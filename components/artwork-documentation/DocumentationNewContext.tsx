"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { ApiArtworkDocumentationContext } from "@/generated/models/ApiArtworkDocumentationContext";
import type { DocumentationDraftController } from "@/lib/artwork-documentation/draft-controller";
import { useArtworkDocumentationAccess } from "@/hooks/artwork-documentation/useArtworkDocumentationAccess";
import {
  createAdditionalDocumentationContext,
  documentationWorkspacePath,
  documentationProfileKey,
} from "@/services/api/artwork-documentation-api";
import { documentationOptionLabel } from "@/i18n/messages/artwork-documentation-fields";
import {
  DocumentationButton,
  DocumentationNotice,
  inputClass,
  panelClass,
  useDocumentationMessages,
} from "./DocumentationControls";

export default function DocumentationNewContext({
  context,
  controller,
}: {
  readonly context: ApiArtworkDocumentationContext;
  readonly controller: DocumentationDraftController;
}) {
  const { msg } = useDocumentationMessages();
  const router = useRouter();
  const access = useArtworkDocumentationAccess();
  const profiles = access.profiles.filter(
    (profile) =>
      profile.profile_id !== context.profile.profile_id ||
      profile.program_id !== context.program_id
  );
  const [profileId, setProfileId] = useState("");
  const [checked, setChecked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const key = useRef(crypto.randomUUID());
  const profile =
    profiles.find((item) => documentationProfileKey(item) === profileId) ??
    profiles[0];
  if (!context.capabilities.confirm_as_artist || !profiles.length) return null;
  const create = async () => {
    if (!profile || !(await controller.flush())) return;
    setBusy(true);
    setError(false);
    try {
      const created = await createAdditionalDocumentationContext(
        context.work_id,
        profile,
        key.current
      );
      router.push(documentationWorkspacePath(created.work_id, created.id));
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  };
  return (
    <details className={panelClass}>
      <summary className="tw-cursor-pointer tw-py-2 tw-text-sm tw-font-medium">
        {msg("newContext")}
      </summary>
      <p className="tw-text-sm tw-leading-relaxed tw-text-iron-400">
        {msg("newContextHelp")}
      </p>
      {error && <DocumentationNotice error>{msg("error")}</DocumentationNotice>}
      <label className="tw-block tw-text-sm tw-text-iron-300">
        {msg("profile")}
        <select
          className={`${inputClass} tw-my-3`}
          value={profile ? documentationProfileKey(profile) : ""}
          onChange={(event) => {
            setProfileId(event.target.value);
            key.current = crypto.randomUUID();
            setChecked(false);
          }}
        >
          {profiles.map((item) => (
            <option
              key={documentationProfileKey(item)}
              value={documentationProfileKey(item)}
            >
              {documentationOptionLabel(item.profile_id)}
              {item.program_id
                ? ` · ${documentationOptionLabel(item.program_id)}`
                : ""}{" "}
              · v{item.version}
            </option>
          ))}
        </select>
      </label>
      <label className="tw-my-4 tw-flex tw-items-start tw-gap-3 tw-text-sm tw-text-iron-300">
        <input
          type="checkbox"
          className="tw-h-5 tw-w-5 tw-accent-primary-400"
          checked={checked}
          onChange={(event) => setChecked(event.target.checked)}
        />
        {msg("newContextAcknowledge")}
      </label>
      <DocumentationButton
        secondary
        disabled={busy || !checked}
        onClick={() => {
          void create();
        }}
      >
        {msg("newContext")}
      </DocumentationButton>
    </details>
  );
}
