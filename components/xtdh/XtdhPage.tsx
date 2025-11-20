"use client";

import type { ReactElement } from "react";

import XtdhReceivedSection from "./received";

export default function XtdhPage(): ReactElement {
  return (
    <div className="tailwind-scope tw-space-y-6">
      <XtdhReceivedSection profileId={null} requireIdentity={false} />
    </div>
  );
}
