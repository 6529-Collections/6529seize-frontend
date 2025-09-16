import UserPageLayout from "@/components/user/layout/UserPageLayout";
import { XtdhProfileProvider } from "@/components/user/xtdh/ProfileContext";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { getAppCommonHeaders } from "@/helpers/server.app.helpers";
import { getUserProfile } from "@/helpers/server.helpers";

async function getProfile(user: string): Promise<ApiIdentity> {
  const headers = await getAppCommonHeaders();
  return await getUserProfile({ user: user.toLowerCase(), headers });
}

export default async function Layout({
  children,
  params,
}: {
  readonly children: React.ReactNode;
  readonly params: Promise<{ user: string }>;
}) {
  const { user } = await params;
  const profile = await getProfile(user);

  return (
    <UserPageLayout profile={profile}>
      <XtdhProfileProvider profile={profile}>
        <div className="tailwind-scope">{children}</div>
      </XtdhProfileProvider>
    </UserPageLayout>
  );
}

