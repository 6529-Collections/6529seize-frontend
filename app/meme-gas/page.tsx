import { getAppMetadata } from "@/components/providers/metadata";
import type { Metadata } from "next";
import { capitalizeEveryWord } from "@/helpers/Helpers";
import { GasRoyaltiesCollectionFocus } from "@/enums";
import styles from "@/styles/Home.module.scss";
import Gas from "@/components/gas-royalties/Gas";

export default function GasPage() {
  return (
    <main className={styles["main"]}>
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
    description: "Tools",
  });
}
