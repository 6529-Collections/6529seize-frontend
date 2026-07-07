import WavesCreatePageClient from "./page.client";
import { getAppMetadata } from "@/components/providers/metadata";
import {
  getCreateWaveInitialConfigFromSearchParams,
  type CreateWaveSearchParams,
} from "@/helpers/waves/create-wave-config.helpers";

export const metadata = getAppMetadata({ title: "Create Wave" });

export default async function WavesCreatePage({
  searchParams,
}: {
  readonly searchParams?: Promise<CreateWaveSearchParams> | undefined;
}) {
  const initialConfig = getCreateWaveInitialConfigFromSearchParams(
    (await searchParams) ?? {}
  );

  return <WavesCreatePageClient initialConfig={initialConfig} />;
}
