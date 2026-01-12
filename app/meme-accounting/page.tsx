import Royalties from "@/components/gas-royalties/Royalties";
import { getAppMetadata } from "@/components/providers/metadata";
import { capitalizeEveryWord } from "@/helpers/Helpers";
import styles from "@/styles/Home.module.scss";
import { GasRoyaltiesCollectionFocus } from "@/types/enums";
import type { Metadata } from "next";

export default function MemeAccountingPage() {
  return (
    <main className={styles["main"]}>
      <Royalties />
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
  const title = `Meme Accounting${
    focusPart ? ` - ${capitalizeEveryWord(focusPart)}` : ""
  }`;
  return getAppMetadata({ title, description: "Tools" });
}
