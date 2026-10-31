import { ABOUT_PAGE_SURFACE_CLASS_NAME } from "@/components/about/AboutLayout";
import Gas from "@/components/gas-royalties/Gas";
import { getAppMetadata } from "@/components/providers/metadata";
import { capitalizeEveryWord } from "@/helpers/Helpers";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import styles from "@/styles/Home.module.css";
import { GasRoyaltiesCollectionFocus } from "@/types/enums";
import clsx from "clsx";
import type { Metadata } from "next";

export default function GasPage() {
  return (
    <main
      className={clsx(
        styles["main"],
        "tailwind-scope",
        ABOUT_PAGE_SURFACE_CLASS_NAME
      )}
    >
      <Gas />
    </main>
  );
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ focus: string }>;
}): Promise<Metadata> {
  const { focus } = await searchParams;
  const resolvedFocus = Object.values(GasRoyaltiesCollectionFocus).find(
    (sd) => sd === focus
  );
  const focusPart = resolvedFocus?.replace("-", " ");
  const title = `Meme Gas${
    focusPart ? ` - ${capitalizeEveryWord(focusPart)}` : ""
  }`;
  return getAppMetadata({
    title,
    description: t(DEFAULT_LOCALE, "pageMetadata.memeGas.description"),
  });
}
