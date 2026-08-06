import type { ReactNode } from "react";

import styles from "./AboutRouteLayout.module.css";

export default function AboutRouteLayout({
  children,
}: {
  readonly children: ReactNode;
}) {
  return <div className={styles["root"]}>{children}</div>;
}
