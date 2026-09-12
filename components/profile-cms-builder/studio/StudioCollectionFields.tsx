import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import type { CmsPackageV1 } from "@/lib/profile-cms/protocol/v1";
import { StudioButton, StudioField, StudioSelect } from "./StudioControls";

type Entry = Record<string, unknown>;

/** Only edit recognized scalar fields; keep imported extension data on each item. */
export function editableEntries(value: unknown): Entry[] | null {
  if (!Array.isArray(value)) return null;
  return value.every((entry: unknown) => {
    if (entry === null || typeof entry !== "object" || Array.isArray(entry))
      return false;
    const fields = entry as Entry;
    return [
      "asset_id",
      "title",
      "subtitle",
      "category",
      "page_id",
      "label",
      "value",
    ].every(
      (key) => fields[key] === undefined || typeof fields[key] === "string"
    );
  })
    ? (value as Entry[])
    : null;
}

function valueOf(entry: Entry, key: string): string {
  return typeof entry[key] === "string" ? entry[key] : "";
}

type ArtworkChange =
  | { kind: "replace" | "remove"; index: number }
  | { kind: "move" | "add" };

function artworkOrder(
  fields: Entry,
  previous: Entry[],
  next: Entry[],
  change: ArtworkChange
): string[] | undefined {
  const source = fields["asset_ids"];
  if (
    source !== undefined &&
    (!Array.isArray(source) || !source.every((id) => typeof id === "string"))
  )
    return undefined;
  const canonical: string[] = source
    ? [...source]
    : previous.map((entry) => valueOf(entry, "asset_id"));
  const used = new Set<number>();
  const positions = previous.map((entry) => {
    const position = canonical.findIndex(
      (id, index) => id === valueOf(entry, "asset_id") && !used.has(index)
    );
    if (position >= 0) used.add(position);
    return position;
  });
  switch (change.kind) {
    case "replace": {
      const position = positions[change.index] ?? -1;
      const id = valueOf(next[change.index] ?? {}, "asset_id");
      if (position >= 0) canonical[position] = id;
      else canonical.push(id);
      break;
    }
    case "remove": {
      const position = positions[change.index] ?? -1;
      if (position >= 0) canonical.splice(position, 1);
      break;
    }
    case "move":
      [...used]
        .sort((a, b) => a - b)
        .forEach((position, index) => {
          canonical[position] = valueOf(next[index] ?? {}, "asset_id");
        });
      break;
    case "add": {
      const last = used.size ? Math.max(...used) + 1 : canonical.length;
      canonical.splice(last, 0, valueOf(next.at(-1) ?? {}, "asset_id"));
      break;
    }
  }
  return canonical;
}

export default function StudioCollectionFields({
  document,
  fields,
  kind,
  locale,
  onChange,
}: {
  readonly document: CmsPackageV1;
  readonly fields: Entry;
  readonly kind: "items" | "rows";
  readonly locale: SupportedLocale;
  readonly onChange: (patch: Entry) => void;
}) {
  const entries = editableEntries(fields[kind]);
  if (!entries) return null;
  const artwork = kind === "items";
  const imageOptions = document.payload.assets
    .filter((asset) => asset.kind === "image" || asset.kind === "social_image")
    .map((asset) => ({
      value: asset.id,
      label:
        asset.alt_text !== undefined && asset.alt_text.length > 0
          ? asset.alt_text
          : asset.id,
    }));
  const update = (next: Entry[], change?: ArtworkChange) => {
    const patch: Entry = { [kind]: next };
    if (artwork) {
      const order = change
        ? artworkOrder(fields, entries, next, change)
        : undefined;
      if (order) patch["asset_ids"] = order;
      const categories = [
        ...new Set(
          next.map((entry) => valueOf(entry, "category")).filter(Boolean)
        ),
      ];
      const previousCategories = new Set(
        entries.map((entry) => valueOf(entry, "category")).filter(Boolean)
      );
      if (
        categories.length !== previousCategories.size ||
        categories.some((category) => !previousCategories.has(category))
      )
        patch["categories"] = categories;
    }
    onChange(patch);
  };
  const changeEntry = (index: number, patch: Entry) =>
    update(
      entries.map((entry, at) =>
        at === index ? { ...entry, ...patch } : entry
      ),
      typeof patch["asset_id"] === "string"
        ? { kind: "replace", index }
        : undefined
    );
  const moveEntry = (index: number, direction: number) => {
    const next = [...entries];
    const moved = next.splice(index, 1)[0];
    if (!moved) return;
    next.splice(index + direction, 0, moved);
    update(next, { kind: "move" });
  };
  return (
    <fieldset className="tw-min-w-0 tw-space-y-3 tw-border-0 tw-p-0">
      <legend className="tw-mb-3 tw-text-sm tw-font-semibold tw-text-white">
        {t(
          locale,
          artwork ? "profileCms.approved.items" : "profileCms.approved.rows"
        )}
      </legend>
      {entries.map((entry, index) => (
        <details
          key={index}
          className="tw-min-w-0 tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-p-3"
        >
          <summary className="tw-cursor-pointer tw-break-words tw-text-sm tw-font-medium focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400">
            {index + 1}.{" "}
            {valueOf(entry, artwork ? "title" : "label") ||
              t(
                locale,
                artwork
                  ? "profileCms.studio.workTitle"
                  : "profileCms.studio.label"
              )}
          </summary>
          <div className="tw-mt-4 tw-space-y-4">
            {artwork ? (
              <>
                <StudioSelect
                  label={t(locale, "profileCms.studio.imageSource")}
                  value={valueOf(entry, "asset_id")}
                  options={imageOptions}
                  onChange={(asset_id) => changeEntry(index, { asset_id })}
                />
                <StudioField
                  label={t(locale, "profileCms.studio.workTitle")}
                  value={valueOf(entry, "title")}
                  onChange={(title) => changeEntry(index, { title })}
                />
                <StudioField
                  label={t(locale, "profileCms.approved.subtitle")}
                  value={valueOf(entry, "subtitle")}
                  onChange={(subtitle) => changeEntry(index, { subtitle })}
                />
                <StudioField
                  label={t(locale, "profileCms.approved.category")}
                  value={valueOf(entry, "category")}
                  onChange={(category) => changeEntry(index, { category })}
                />
              </>
            ) : (
              <>
                <StudioField
                  label={t(locale, "profileCms.studio.label")}
                  value={valueOf(entry, "label")}
                  onChange={(label) => changeEntry(index, { label })}
                />
                <StudioField
                  label={t(locale, "profileCms.approved.value")}
                  value={valueOf(entry, "value")}
                  multiline
                  onChange={(value) => changeEntry(index, { value })}
                />
              </>
            )}
            <StudioSelect
              label={t(locale, "profileCms.studio.destination")}
              value={valueOf(entry, "page_id")}
              options={[
                { value: "", label: t(locale, "profileCms.approved.noLink") },
                ...document.payload.pages.map((page) => ({
                  value: page.id,
                  label: page.metadata.title,
                })),
              ]}
              onChange={(page_id) => {
                const replacement = { ...entry };
                if (page_id) replacement["page_id"] = page_id;
                else delete replacement["page_id"];
                update(
                  entries.map((item, at) => (at === index ? replacement : item))
                );
              }}
            />
            <div className="tw-flex tw-flex-wrap tw-gap-2">
              <StudioButton
                disabled={index === 0}
                onClick={() => moveEntry(index, -1)}
              >
                {t(locale, "profileCms.studio.moveUp")}
              </StudioButton>
              <StudioButton
                disabled={index === entries.length - 1}
                onClick={() => moveEntry(index, 1)}
              >
                {t(locale, "profileCms.studio.moveDown")}
              </StudioButton>
              <StudioButton
                onClick={() =>
                  update(
                    entries.filter((_, at) => at !== index),
                    { kind: "remove", index }
                  )
                }
              >
                {t(locale, "profileCms.studio.remove")}
              </StudioButton>
            </div>
          </div>
        </details>
      ))}
      <StudioButton
        disabled={artwork && imageOptions.length === 0}
        onClick={() =>
          update(
            [
              ...entries,
              artwork
                ? {
                    asset_id: imageOptions[0]?.value ?? "",
                    title: t(locale, "profileCms.studio.workTitle"),
                    subtitle: "",
                    category: "",
                  }
                : { label: t(locale, "profileCms.studio.label"), value: "" },
            ],
            { kind: "add" }
          )
        }
      >
        ＋{" "}
        {t(
          locale,
          artwork ? "profileCms.approved.addItem" : "profileCms.approved.addRow"
        )}
      </StudioButton>
      {artwork ? (
        <>
          <label className="tw-flex tw-items-start tw-gap-3 tw-text-sm">
            <input
              type="checkbox"
              checked={fields["searchable"] === true}
              onChange={(event) =>
                onChange({ searchable: event.target.checked })
              }
              className="tw-h-4 tw-w-4 tw-accent-primary-500"
            />
            {t(locale, "profileCms.approved.searchable")}
          </label>
          <label className="tw-flex tw-items-start tw-gap-3 tw-text-sm">
            <input
              type="checkbox"
              checked={
                Array.isArray(fields["display_modes"]) &&
                fields["display_modes"].includes("list")
              }
              onChange={(event) =>
                onChange({
                  display_modes: event.target.checked
                    ? ["grid", "list"]
                    : ["grid"],
                })
              }
              className="tw-h-4 tw-w-4 tw-accent-primary-500"
            />
            {t(locale, "profileCms.approved.listOption")}
          </label>
        </>
      ) : null}
    </fieldset>
  );
}
