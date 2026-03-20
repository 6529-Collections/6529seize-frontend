import { getTheMemesMintMetadata } from "@/components/the-memes/TheMemesMintPageShell";
import StandaloneTheMemesMintPageClient from "./StandaloneTheMemesMintPageClient";

export const dynamic = "force-static";
export const metadata = getTheMemesMintMetadata({ standalone: true });

export default function StandaloneTheMemesMintPage() {
  return <StandaloneTheMemesMintPageClient />;
}
