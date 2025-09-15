"use client";

import { useState } from "react";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import XTDHTabs from "./ui/XTDHTabs";
import XTDHOverview from "./overview/XTDHOverview";
import XTDHGiven from "./give/XTDHGiven";
import XTDHReceived from "./receive/XTDHReceived";
import XTDHHistory from "./history/XTDHHistory";
import type { ReceiveFilter, XtdhInnerTab } from "./types";
import { XtdhInnerTab as TabId } from "./types";


export default function UserPageXTDH({ profile }: { profile: ApiIdentity }) {
  const [tab, setTab] = useState<XtdhInnerTab>(TabId.OVERVIEW);



  return (
    <div className="tw-flex tw-flex-col tw-gap-6">
      <XTDHTabs active={tab} onChange={setTab} />

      {tab === TabId.OVERVIEW && (
        <XTDHOverview profile={profile} onGoGive={() => setTab(TabId.GIVEN)} onGoReceive={() => setTab(TabId.RECEIVED)} />
      )}
      {tab === TabId.GIVEN && <XTDHGiven profile={profile} />}
      {tab === TabId.RECEIVED && <XTDHReceived profile={profile} />}
      {tab === TabId.HISTORY && <XTDHHistory />}
    </div>
  );
}
