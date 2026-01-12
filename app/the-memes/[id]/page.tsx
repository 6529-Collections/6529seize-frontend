import styles from "@/styles/Home.module.scss";

import MemePageComponent from "@/components/the-memes/MemePage";
import { getSharedAppServerSideProps } from "@/components/the-memes/MemeShared";
import { MEMES_CONTRACT } from "@/constants/constants";
import type { Metadata } from "next";

export default async function MemePage({
  params,
}: {
  readonly params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <main className={styles["main"]}>
      <MemePageComponent nftId={id} />
    </main>
  );
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ focus: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const { focus } = await searchParams;
  return getSharedAppServerSideProps(MEMES_CONTRACT, id, focus);
}
