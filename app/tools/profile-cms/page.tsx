import { getAppMetadata } from "@/components/providers/metadata";
import type { Metadata } from "next";
import ProfileCmsStudio from "@/components/cms/studio/ProfileCmsStudio";

export default function ProfileCmsStudioPage() {
  return <ProfileCmsStudio />;
}

export function generateMetadata(): Metadata {
  return getAppMetadata({
    title: "Profile CMS Studio",
    description: "Tools",
  });
}
