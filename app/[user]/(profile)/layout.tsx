import type { ReactNode } from "react";
import UserPageLayout from "@/components/user/layout/UserPageLayout";
import { getUserPageProfile } from "../_lib/userTabPageFactory";

export default async function ProfileLayout({
  params,
  children,
}: {
  readonly params: Promise<{ user: string }>;
  readonly children: ReactNode;
}) {
  const { user } = await params;
  const profile = await getUserPageProfile(user);
  return (
    <UserPageLayout profile={profile} handleOrWallet={user}>
      {children}
    </UserPageLayout>
  );
}
