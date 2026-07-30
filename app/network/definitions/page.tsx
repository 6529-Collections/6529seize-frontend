import { getAppMetadata } from "@/components/providers/metadata";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import DefinitionsClient from "./page.client";

export default function Definitions() {
  return <DefinitionsClient />;
}

export const generateMetadata = async () => {
  return getAppMetadata({
    title: t(DEFAULT_LOCALE, "network.definitions.metadata.title"),
    description: "Network",
  });
};
