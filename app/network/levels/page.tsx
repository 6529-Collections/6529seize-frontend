import { getAppMetadata } from "@/components/providers/metadata";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import LevelsClient from "./page.client";

export default function Levels() {
  return <LevelsClient />;
}

export const generateMetadata = async () => {
  return getAppMetadata({
    title: "Levels | Network",
    description: t(DEFAULT_LOCALE, "pageMetadata.networkLevels.description"),
  });
};
