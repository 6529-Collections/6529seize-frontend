import styles from "@/styles/Home.module.scss";
import MemeLabPageComponent from "@/components/memelab/MemeLabPage";
import { Metadata } from "next";
import { MEMELAB_CONTRACT } from "@/constants";
import { getSharedAppServerSideProps } from "@/components/the-memes/MemeShared";
import { useAuth } from "@/components/auth/Auth";

function MemeLabPageClient() {
  "use client";
  const { connectedProfile } = useAuth();
  return (
    <MemeLabPageComponent
      wallets={connectedProfile?.wallets?.map((w) => w.wallet) ?? []}
    />
  );
}

export default async function MemeLabPage({
  params,
}: {
  readonly params: Promise<{ id: string }>;
}) {
  const { id: _id } = await params;
  return (
    <main className={styles.main}>
      <MemeLabPageClient />
    </main>
  );
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  readonly params: Promise<{ id: string }>;
  readonly searchParams: Promise<{ focus: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const { focus } = await searchParams;
  return getSharedAppServerSideProps(MEMELAB_CONTRACT, id, focus);
}

