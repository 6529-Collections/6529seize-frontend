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
    <div className="[&>section>header>h2]:tw-text-[15px] [&>section>header>p]:tw-text-meta [&>section>header>p]:tw-font-normal [&>section>header>p]:tw-text-iron-500 [&>section>header]:tw-px-0 [&>section>header]:tw-pt-0 [&>section>section>div>input:hover:not(:focus)]:tw-ring-white/10 [&>section>section>div>input:not(:focus)]:tw-ring-white/5 [&_input]:tw-text-[16px] [&_input]:tw-font-normal md:desktop-hover:[&_input]:tw-text-[14px] [&>section>section]:tw-border-white/[0.04] [&>section>section]:tw-bg-transparent [&>section>section]:tw-px-0 [&>section]:tw-border-0 [&>section]:tw-bg-transparent [&_.tw-border-dashed>span:first-child]:tw-text-sm [&_.tw-border-dashed>span:first-child]:tw-font-medium [&_.tw-border-dashed>span:first-child]:tw-text-iron-400 [&_.tw-border-dashed>span:last-child]:tw-text-meta [&_.tw-border-dashed>span:last-child]:tw-font-normal [&_.tw-border-dashed>span:last-child]:tw-text-iron-500 [&_.tw-border-dashed]:tw-items-start [&_.tw-border-dashed]:tw-border-0 [&_.tw-border-dashed]:tw-bg-iron-900/50 [&_.tw-border-dashed]:tw-p-6 [&_.tw-border-dashed]:tw-text-left max-sm:[&_[data-xtdh-skeleton-metrics]]:tw-grid-cols-2 max-sm:[&_[data-xtdh-skeleton-metrics]]:tw-gap-x-3 max-sm:[&_[data-xtdh-skeleton-thumbnail]]:tw-size-12 [&_dd]:tw-text-sm [&_dd]:tw-font-medium [&_dd]:tw-tabular-nums [&_dd]:tw-text-iron-100 [&_dt]:tw-text-[11px] [&_li>button:focus-visible]:tw-outline-none [&_li>button:focus-visible]:tw-ring-2 [&_li>button:focus-visible]:tw-ring-inset [&_li>button:focus-visible]:tw-ring-primary-400 [&_li>button>div>dl>div]:tw-min-w-0 max-sm:[&_li>button>div>dl]:tw-grid-cols-2 max-sm:[&_li>button>div>dl]:tw-gap-x-3 [&_li>button>div>dl_dd]:tw-break-words [&_li>button>div>dl_dt]:tw-break-words max-sm:[&_li>button>div>header>div:first-child>div:first-child]:tw-size-12 [&_li>button]:tw-rounded-xl [&_ul]:tw-divide-white/[0.04] [&_ul]:tw-overflow-hidden [&_ul]:tw-rounded-xl [&_ul]:tw-bg-iron-900/50">
      <XtdhReceivedSection profileId={profileId} />
    </div>
  );
}
