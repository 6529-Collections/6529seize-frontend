"use client";

import XtdhReceivedSection from "../../received";
import type { ReactElement } from "react";

interface UserXtdhReceivedSectionProps {
  readonly profileId: string | null;
}

export default function UserPageXtdhReceived({
  profileId,
}: Readonly<UserXtdhReceivedSectionProps>): ReactElement {
  return (
    <div className="[&>section>header>p]:tw-text-[13px] [&>section>header]:tw-px-0 [&>section>header]:tw-pt-0 [&>section>section]:tw-px-0 [&>section]:tw-border-0 [&>section]:tw-bg-transparent [&_.tw-border-dashed>span:first-child]:tw-text-sm [&_.tw-border-dashed>span:first-child]:tw-font-medium [&_.tw-border-dashed>span:first-child]:tw-text-iron-400 [&_.tw-border-dashed>span:last-child]:tw-text-[13px] [&_.tw-border-dashed>span:last-child]:tw-text-iron-500 [&_.tw-border-dashed]:tw-items-start [&_.tw-border-dashed]:tw-border-0 [&_.tw-border-dashed]:tw-bg-iron-900/50 [&_.tw-border-dashed]:tw-p-6 [&_.tw-border-dashed]:tw-text-left [&_dd]:tw-text-sm [&_dd]:tw-font-medium [&_dd]:tw-text-iron-100 [&_dt]:tw-text-[11px] [&_li>button:focus-visible]:tw-outline-none [&_li>button:focus-visible]:tw-ring-2 [&_li>button:focus-visible]:tw-ring-inset [&_li>button:focus-visible]:tw-ring-primary-400 [&_li>button]:tw-rounded-xl [&_ul]:tw-divide-white/[0.04] [&_ul]:tw-overflow-hidden [&_ul]:tw-rounded-xl [&_ul]:tw-bg-iron-900/50">
      <XtdhReceivedSection profileId={profileId} />
    </div>
  );
}
