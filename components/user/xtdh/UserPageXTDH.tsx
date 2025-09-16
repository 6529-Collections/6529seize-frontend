"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import XTDHTabs from "./ui/XTDHTabs";
import XTDHOverview from "./overview/XTDHOverview";
import XTDHGiven from "./give/XTDHGiven";
import XTDHReceived from "./receive/XTDHReceived";
import XTDHHistory from "./history/XTDHHistory";
import type { XtdhInnerTab } from "./types";
import { XtdhInnerTab as TabId } from "./types";


export default function UserPageXTDH({ profile }: { profile: ApiIdentity }) {
  const params = useParams<{ user?: string; tab?: string }>();
  const activeTab: XtdhInnerTab = useMemo(() => {
    const slug = (params?.tab || "overview").toString().toLowerCase();
    switch (slug) {
      case "overview":
        return TabId.OVERVIEW;
      case "given":
        return TabId.GIVEN;
      case "received":
        return TabId.RECEIVED;
      case "history":
        return TabId.HISTORY;
      default:
        return TabId.OVERVIEW;
    }
  }, [params?.tab]);
  const basePath = `/${profile.handle}/xtdh`;

  return (
    <div className="tw-flex tw-flex-col tw-gap-6">
      <XTDHTabs active={activeTab} basePath={basePath} />

      {activeTab === TabId.OVERVIEW && <XTDHOverview profile={profile} />}
      {activeTab === TabId.GIVEN && <XTDHGiven profile={profile} />}
      {activeTab === TabId.RECEIVED && <XTDHReceived profile={profile} />}
      {activeTab === TabId.HISTORY && <XTDHHistory />}
    </div>
  );
}
