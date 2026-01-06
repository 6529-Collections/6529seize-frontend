"use client";

import type { ReactNode} from "react";
import { useState } from "react";
import GroupsSidebarApp from "@/components/groups/sidebar/GroupsSidebarApp";
import GroupsSidebarAppToggle from "@/components/groups/sidebar/GroupsSidebarAppToggle";

export default function SidebarLayoutApp({
  children,
}: {
  readonly children: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <main className="tailwind-scope tw-bg-iron-950 tw-overflow-x-hidden">
      <GroupsSidebarApp open={open} onClose={() => setOpen(false)} />
      <GroupsSidebarAppToggle open={open} setOpen={setOpen} />
      <div className="tailwind-scope tw-bg-iron-950 tw-mt-6 lg:tw-mt-8 tw-pb-6 lg:tw-pb-8 tw-px-4 tw-mx-auto">
        {children}
      </div>
    </main>
  );
}
