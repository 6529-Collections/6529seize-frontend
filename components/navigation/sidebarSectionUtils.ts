import {
  DROP_FORGE_PATH,
  DROP_FORGE_TITLE,
} from "@/components/drop-forge/drop-forge.constants";
import type { SidebarSection } from "@/components/navigation/navTypes";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";

const DEVELOPER_SECTION_NAME = t(
  DEFAULT_LOCALE,
  "navigation.subsection.developerOpenData"
);

export function appendDropForgeToAbout(
  section: SidebarSection
): SidebarSection {
  const dropForgeItem = { name: DROP_FORGE_TITLE, href: DROP_FORGE_PATH };
  const subsections = section.subsections ?? [];
  const hasDeveloperSection = subsections.some(
    (subsection) => subsection.name === DEVELOPER_SECTION_NAME
  );

  return {
    ...section,
    subsections: hasDeveloperSection
      ? subsections.map((subsection) =>
          subsection.name === DEVELOPER_SECTION_NAME
            ? { ...subsection, items: [...subsection.items, dropForgeItem] }
            : subsection
        )
      : [
          ...subsections,
          {
            name: DEVELOPER_SECTION_NAME,
            items: [dropForgeItem],
          },
        ],
  };
}
