import { permanentRedirect } from "next/navigation";

export default function ContentPreferencesPage() {
  permanentRedirect("/preferences?tab=content");
}
