import { XtdhMetricsSection } from "./subcomponents/XtdhMetricsSection";
import { XtdhReceivingSection } from "./subcomponents/XtdhReceivingSection";
import { getXtdhStatsSectionClassName } from "./utils/getXtdhStatsSectionClassName";
import type { XtdhStatsProps } from "./types";

export function XtdhStats({
  metrics,
  receiving,
  className,
}: Readonly<XtdhStatsProps>) {
  const sectionClassName = getXtdhStatsSectionClassName(className);

  return (
    <section className={sectionClassName} aria-label="xTDH Statistics">
      <XtdhMetricsSection {...metrics} />
      {receiving ? <XtdhReceivingSection {...receiving} /> : null}
    </section>
  );
}

export type { XtdhStatsProps } from "./types";
