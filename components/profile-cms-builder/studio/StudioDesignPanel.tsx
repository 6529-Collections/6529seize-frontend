import { useState } from "react";

import type { SupportedLocale } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";
import type { CmsPackageV1 } from "@/lib/profile-cms/protocol/v1";
import type { CmsDocumentOperation } from "@/lib/profile-cms/studio/document";
import {
  CMS_STUDIO_DENSITIES,
  CMS_STUDIO_LAYOUTS,
  CMS_STUDIO_PALETTES,
  CMS_STUDIO_TYPES,
  DEFAULT_CMS_STUDIO_PRESENTATION,
  getCmsStudioPresentation,
  type CmsStudioPresentation,
} from "@/lib/profile-cms/studio/presentation";
import { StudioButton, StudioField, StudioSelect } from "./StudioControls";
import StudioForm, { type StudioFormState } from "./StudioForm";

const DESIGN_LABELS: Record<string, MessageKey> = {
  signature: "profileCms.studio.signature",
  editorial: "profileCms.studio.editorial",
  gallery: "profileCms.studio.gallery",
  journal: "profileCms.studio.journal",
  organization: "profileCms.studio.organizationLayout",
  fund: "profileCms.studio.fundLayout",
  dao: "profileCms.studio.dao",
  ink: "profileCms.studio.ink",
  paper: "profileCms.studio.paper",
  stone: "profileCms.studio.stone",
  night: "profileCms.studio.night",
  sans: "profileCms.studio.sans",
  serif: "profileCms.studio.serif",
  mono: "profileCms.studio.mono",
  airy: "profileCms.studio.airy",
  balanced: "profileCms.studio.balanced",
  compact: "profileCms.studio.compact",
};

export default function StudioDesignPanel({
  document,
  locale,
  onOperation,
  onApply,
  formState,
}: {
  readonly document: CmsPackageV1;
  readonly locale: SupportedLocale;
  readonly onOperation: (operation: CmsDocumentOperation) => boolean;
  readonly onApply: (operation: CmsDocumentOperation) => boolean;
  readonly formState: StudioFormState;
}) {
  const [title, setTitle] = useState(document.site.title);
  const [description, setDescription] = useState(
    document.site.description ?? ""
  );
  const [accent, setAccent] = useState(document.site.theme.accent);
  const [invalid, setInvalid] = useState(false);
  const design =
    getCmsStudioPresentation(document) ?? DEFAULT_CMS_STUDIO_PRESENTATION;
  const choose = (patch: Partial<CmsStudioPresentation>) =>
    onOperation({
      type: "update_site",
      patch: { theme: { tokens: { ...design, ...patch } } },
    });
  const options = (values: readonly string[]) =>
    values.map((value) => ({
      value,
      label: t(locale, DESIGN_LABELS[value] ?? "profileCms.studio.design"),
    }));
  return (
    <div className="tw-space-y-6">
      <StudioForm
        locale={locale}
        state={formState}
        onSubmit={() => {
          if (!title.trim() || !/^#[0-9a-f]{6}$/i.test(accent)) {
            setInvalid(true);
            return false;
          }
          const applied = onApply({
            type: "update_site",
            patch: { title: title.trim(), description, theme: { accent } },
          });
          if (applied) setInvalid(false);
          return applied;
        }}
      >
        <StudioField
          label={t(locale, "profileCms.studio.siteTitle")}
          value={title}
          onChange={setTitle}
          maxLength={160}
          invalid={invalid && !title.trim()}
        />
        <StudioField
          label={t(locale, "profileCms.studio.accent")}
          value={accent}
          onChange={setAccent}
          maxLength={7}
          invalid={invalid && !/^#[0-9a-f]{6}$/i.test(accent)}
        />
        {invalid && (
          <p role="alert" className="tw-text-red-300 tw-text-sm">
            {t(locale, "profileCms.studio.invalidDesign")}
          </p>
        )}
        <StudioField
          label={t(locale, "profileCms.studio.siteDescription")}
          value={description}
          onChange={setDescription}
          multiline
          maxLength={300}
        />
        <StudioButton type="submit">
          {t(locale, "profileCms.studio.apply")}
        </StudioButton>
      </StudioForm>
      <StudioSelect
        label={t(locale, "profileCms.studio.layout")}
        value={design.studio_layout}
        options={options(CMS_STUDIO_LAYOUTS)}
        onChange={(value) => {
          const layout = CMS_STUDIO_LAYOUTS.find((item) => item === value);
          if (layout) choose({ studio_layout: layout });
        }}
      />
      <StudioSelect
        label={t(locale, "profileCms.studio.palette")}
        value={design.studio_palette}
        options={options(CMS_STUDIO_PALETTES)}
        onChange={(value) => {
          const palette = CMS_STUDIO_PALETTES.find((item) => item === value);
          if (palette) choose({ studio_palette: palette });
        }}
      />
      <StudioSelect
        label={t(locale, "profileCms.studio.typography")}
        value={design.studio_type}
        options={options(CMS_STUDIO_TYPES)}
        onChange={(value) => {
          const type = CMS_STUDIO_TYPES.find((item) => item === value);
          if (type) choose({ studio_type: type });
        }}
      />
      <StudioSelect
        label={t(locale, "profileCms.studio.spacing")}
        value={design.studio_density}
        options={options(CMS_STUDIO_DENSITIES)}
        onChange={(value) => {
          const density = CMS_STUDIO_DENSITIES.find((item) => item === value);
          if (density) choose({ studio_density: density });
        }}
      />
    </div>
  );
}
