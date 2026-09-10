import { getAppMetadata } from "@/components/providers/metadata";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import TDHMainPage from "./page.client";

export default function TDH() {
  return <TDHMainPage />;
}

export const generateMetadata = () => {
  return getAppMetadata({
    title: t(DEFAULT_LOCALE, "network.tdh.explainer.pageTitle"),
    description: t(DEFAULT_LOCALE, "network.tdh.explainer.metadataDescription"),
  });
};
