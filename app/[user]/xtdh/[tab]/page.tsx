"use client";

import UserPageXTDH from "@/components/user/xtdh/UserPageXTDH";
import { useXtdhProfile } from "@/components/user/xtdh/ProfileContext";

export default function Page() {
  const profile = useXtdhProfile();
  return <UserPageXTDH profile={profile} />;
}
