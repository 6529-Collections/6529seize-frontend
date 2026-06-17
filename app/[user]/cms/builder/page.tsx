import ProfileCmsBuilder from "@/components/profile-cms-builder/ProfileCmsBuilder";
import { getAppMetadata } from "@/components/providers/metadata";
import { isProfileCmsBuilderEnabledEnv } from "@/config/profileCmsBuilderEnv";
import { getAppCommonHeaders } from "@/helpers/server.app.helpers";
import { getUserProfile } from "@/helpers/server.helpers";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

type ProfileCmsBuilderParams = {
  readonly user: string;
};

export const metadata: Metadata = getAppMetadata({
  title: t(DEFAULT_LOCALE, "profileCms.builder.pageTitle"),
  description: t(DEFAULT_LOCALE, "profileCms.builder.pageDescription"),
});

export default async function ProfileCmsBuilderPage({
  params,
}: {
  readonly params?: Promise<ProfileCmsBuilderParams>;
}) {
  if (!isProfileCmsBuilderEnabledEnv()) {
    return notFound();
  }

  const resolvedParams = params ? await params : undefined;
  const handle = resolvedParams?.user?.trim();
  if (!handle) {
    return notFound();
  }

  const headers = await getAppCommonHeaders();
  const profile = await getUserProfile({ user: handle.toLowerCase(), headers });

  return (
    <ProfileCmsBuilder
      handle={profile.handle ?? handle}
      locale={DEFAULT_LOCALE}
      profileId={profile.id ?? undefined}
      title={t(DEFAULT_LOCALE, "profileCms.builder.pageTitle")}
    />
  );
}
