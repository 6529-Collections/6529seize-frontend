"use client";

import { forwardRef, type ReactNode } from "react";

const SubscriptionsReportRow = forwardRef<
  HTMLTableRowElement,
  Readonly<{
    children: ReactNode;
    className: string;
  }>
>(function SubscriptionsReportRow({ children, className }, ref) {
  return (
    <tr ref={ref} className={`${className} tw-group tw-cursor-pointer`}>
      {children}
    </tr>
  );
});

export default SubscriptionsReportRow;
