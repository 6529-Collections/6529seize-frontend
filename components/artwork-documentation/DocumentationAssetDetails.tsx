"use client";

import { useState } from "react";
import type { ApiArtworkDocumentationContext } from "@/generated/models/ApiArtworkDocumentationContext";
import type { ApiArtworkDocumentationAssetLink } from "@/generated/models/ApiArtworkDocumentationAssetLink";
import type { ApiArtworkDocumentationAssetLinkRequest } from "@/generated/models/ApiArtworkDocumentationAssetLinkRequest";
import type { DocumentationDraftController } from "@/lib/artwork-documentation/draft-controller";
import type {
  FieldValue,
  ValueEditor,
} from "@/lib/artwork-documentation/registry";
import {
  linkDocumentationAsset,
  patchDocumentationAssetLink,
} from "@/services/api/artwork-documentation-assets-api";
import { documentationOptionLabel } from "@/i18n/messages/artwork-documentation-fields";
import { DOCUMENTATION_ASSET_ROLES } from "@/lib/artwork-documentation/asset-roles";
import DocumentationValueEditor from "./DocumentationValueEditor";
import {
  DocumentationButton,
  inputClass,
  useDocumentationMessages,
} from "./DocumentationControls";

const detailsEditor: ValueEditor = {
  kind: "object",
  fields: {
    label: { kind: "text", max: 160 },
    description: { kind: "text", max: 1000, multiline: true },
    source_of_asset: {
      kind: "choice",
      options: ["self", "collaborator", "third_party", "unknown"],
    },
    source_credit: { kind: "text", max: 500 },
    deposit_note: { kind: "text", max: 1000, multiline: true },
    intended_terms: {
      kind: "object",
      fields: {
        kind: {
          kind: "choice",
          options: [
            "unspecified",
            "private_deposit",
            "proposed_license",
            "already_licensed",
          ],
        },
        license_uri: { kind: "text", max: 2048 },
        note: { kind: "text", max: 2000, multiline: true },
      },
    },
  },
};

export default function DocumentationAssetDetails({
  context,
  assetId,
  controller,
}: {
  readonly context: ApiArtworkDocumentationContext;
  readonly assetId: string;
  readonly controller: DocumentationDraftController;
}) {
  const { msg } = useDocumentationMessages();
  const [role, setRole] = useState("preservation_master");
  const links = context.asset_links.filter((link) => link.asset_id === assetId);
  const asset = context.assets.find((item) => item.id === assetId);
  const addRole = () =>
    controller.mutate((current, signal) =>
      linkDocumentationAsset(
        current,
        {
          asset_id: assetId,
          role,
          intended_visibility: asset?.intended_visibility ?? "restricted",
          intended_terms: { kind: "private_deposit" },
        } as ApiArtworkDocumentationAssetLinkRequest,
        signal
      )
    );
  return (
    <details className="tw-mt-3">
      <summary className="tw-cursor-pointer tw-py-2 tw-text-xs tw-text-iron-300">
        {msg("fileDetails")}
      </summary>
      <div className="tw-space-y-4">
        {links.map((link) => (
          <ManifestEditor key={link.id} link={link} controller={controller} />
        ))}
        <label className="tw-block tw-text-xs tw-text-iron-400">
          {msg("uploadRole")}
          <select
            className={`${inputClass} tw-mt-2`}
            value={role}
            onChange={(event) => setRole(event.target.value)}
          >
            {DOCUMENTATION_ASSET_ROLES.map((option) => (
              <option key={option} value={option}>
                {documentationOptionLabel(option)}
              </option>
            ))}
          </select>
        </label>
        <DocumentationButton
          secondary
          disabled={links.some((link) => link.role === role)}
          onClick={() => {
            void addRole();
          }}
        >
          {msg("add")}
        </DocumentationButton>
      </div>
    </details>
  );
}

function ManifestEditor({
  link,
  controller,
}: {
  readonly link: ApiArtworkDocumentationAssetLink;
  readonly controller: DocumentationDraftController;
}) {
  const { msg } = useDocumentationMessages();
  const pending = controller
    .snapshot()
    .contentEdits.find((edit) => edit.id === `asset-link:${link.id}`)?.value;
  const value = (pending ?? {
    label: link.label,
    description: link.description,
    source_of_asset: link.source_of_asset,
    source_credit: link.source_credit,
    deposit_note: link.deposit_note,
    intended_terms: { ...link.intended_terms },
    intended_visibility: link.intended_visibility,
  }) as Record<string, FieldValue>;
  const restricted = ["consent_instrument", "rights_instrument"].includes(
    link.role
  );
  const change = (next: FieldValue) => {
    const body = {
      ...(next as Record<string, FieldValue>),
      intended_visibility: restricted
        ? "restricted"
        : ((next as Record<string, FieldValue>)["intended_visibility"] ??
          link.intended_visibility),
    };
    controller.queueContent(
      `asset-link:${link.id}`,
      body,
      (current, key, signal) =>
        patchDocumentationAssetLink(current, link.id, body, signal, key)
    );
  };
  const intendedVisibility =
    !restricted && value["intended_visibility"] === "public_record"
      ? "public_record"
      : "restricted";
  return (
    <div className="tw-space-y-3 tw-rounded-lg tw-border tw-border-solid tw-border-iron-800 tw-p-3">
      <p className="tw-text-sm tw-font-medium">
        {documentationOptionLabel(link.role)}
      </p>
      <DocumentationValueEditor
        id={`manifest-${link.id}`}
        label={msg("fileDetails")}
        editor={detailsEditor}
        value={value}
        onChange={change}
      />
      <label className="tw-block tw-text-xs tw-text-iron-400">
        {msg("visibility")}
        <select
          className={`${inputClass} tw-mt-2`}
          value={intendedVisibility}
          disabled={restricted}
          onChange={(event) =>
            change({ ...value, intended_visibility: event.target.value })
          }
        >
          <option value="restricted">{msg("restricted")}</option>
          <option value="public_record">{msg("publicIntent")}</option>
        </select>
      </label>
      <DocumentationButton
        secondary
        onClick={() => {
          void controller.flush();
        }}
      >
        {msg("save")}
      </DocumentationButton>
    </div>
  );
}
