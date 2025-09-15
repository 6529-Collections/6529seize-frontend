"use client";

import { useState } from "react";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import XTDHTabs from "./ui/XTDHTabs";
import XTDHOverview from "./overview/XTDHOverview";
import XTDHGive from "./give/XTDHGive";
import XTDHReceive from "./receive/XTDHReceive";
import XTDHHistory from "./history/XTDHHistory";
import type { ReceiveFilter, XtdhInnerTab } from "./types";
import { XtdhInnerTab as TabId } from "./types";
 

export default function UserPageXTDH({ profile }: { profile: ApiIdentity }) {
  const [tab, setTab] = useState<XtdhInnerTab>(TabId.OVERVIEW);
  // Children fetch their own data via hooks; no summary/rows needed here


  return (
    <div className="tw-flex tw-flex-col tw-gap-6">
      <XTDHTabs active={tab} onChange={setTab} />

      {tab === TabId.OVERVIEW && (
        <XTDHOverview profile={profile} onGoGive={() => setTab(TabId.GIVE)} onGoReceive={() => setTab(TabId.RECEIVE)} />
      )}
      {tab === TabId.GIVE && <XTDHGive profile={profile} />}
      {tab === TabId.RECEIVE && <XTDHReceive profile={profile} />}
      {tab === TabId.HISTORY && <XTDHHistory />}
    </div>
  );
}
