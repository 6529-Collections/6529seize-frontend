"use client";

import { useContext } from "react";
import { IdentityActivityContext } from "../IdentityActivityContext";
import type { ProfileActivityLog } from "@/entities/IProfile";
import ProfileActivityLogsItem from "./ProfileActivityLogsItem";
import ProfileActivityLogItemWrapper from "./items/utils/ProfileActivityLogItemWrapper";

export default function UserPageIdentityActivityLogList({
  logs,
  user,
}: {
  readonly logs: ProfileActivityLog[];
  readonly user: string | null;
}) {
  const compact = useContext(IdentityActivityContext);
  return (
    <div className="tw-mt-4 md:tw-mt-6">
      <div
        className={
          compact
            ? "tw-overflow-hidden tw-rounded-xl tw-bg-iron-950 tw-@container"
            : "tw-space-y-2.5"
        }
      >
        {logs.map((log) => (
          <ProfileActivityLogItemWrapper key={log.id} log={log} user={user}>
            <ProfileActivityLogsItem log={log} user={user} />
          </ProfileActivityLogItemWrapper>
        ))}
      </div>
    </div>
  );
}
