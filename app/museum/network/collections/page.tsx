import { permanentRedirect } from "next/navigation";

export default function MuseumCollectionsLegacyPage() {
  permanentRedirect("/museum/network/collection");
}
