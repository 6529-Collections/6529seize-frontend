import type { CSSProperties } from "react";

interface StreamRouteLoadingShellProps {
  readonly ariaLabel: string;
  readonly variant: "waves" | "messages";
}

const sidebarRows = [68, 54, 74, 62, 48, 70] as const;
const contentRows = [82, 58, 74, 64] as const;

const routeLoadingMinHeightStyle: CSSProperties = {
  minHeight:
    "calc(100dvh - var(--stream-route-loading-header-reserve, 0px) - var(--stream-route-loading-bottom-reserve, 0px))",
};

const SkeletonBlock = ({
  className,
  style,
}: {
  readonly className: string;
  readonly style?: CSSProperties | undefined;
}) => (
  <div
    aria-hidden="true"
    className={`tw-animate-pulse tw-rounded-md tw-bg-iron-800/80 ${className}`}
    style={style}
  />
);

export default function StreamRouteLoadingShell({
  ariaLabel,
  variant,
}: StreamRouteLoadingShellProps) {
  const primaryWidth = variant === "messages" ? "56%" : "68%";
  const secondaryWidth = variant === "messages" ? "42%" : "50%";

  return (
    <div
      className="tailwind-scope tw-bg-black tw-text-iron-50"
      style={routeLoadingMinHeightStyle}
      role="status"
      aria-live="polite"
      aria-label={ariaLabel}
      data-testid="stream-route-loading-shell">
      <span className="tw-sr-only">{ariaLabel}</span>
      <div
        className="tw-flex tw-overflow-hidden"
        style={routeLoadingMinHeightStyle}>
        <aside className="tw-hidden tw-w-80 tw-shrink-0 tw-border-r tw-border-iron-900 tw-bg-iron-950 md:tw-flex md:tw-flex-col">
          <div className="tw-border-b tw-border-iron-900 tw-px-4 tw-py-4">
            <SkeletonBlock className="tw-h-5" style={{ width: primaryWidth }} />
            <SkeletonBlock
              className="tw-mt-3 tw-h-3"
              style={{ width: secondaryWidth }}
            />
          </div>
          <div className="tw-space-y-3 tw-p-3">
            {sidebarRows.map((width, index) => (
              <div
                key={width}
                className="tw-flex tw-items-center tw-gap-3 tw-rounded-md tw-bg-iron-900/55 tw-p-3">
                <SkeletonBlock className="tw-size-10 tw-shrink-0 tw-rounded-full" />
                <div className="tw-min-w-0 tw-flex-1">
                  <SkeletonBlock
                    className="tw-h-3"
                    style={{ width: `${width}%` }}
                  />
                  <SkeletonBlock
                    className="tw-mt-3 tw-h-2.5"
                    style={{ width: `${sidebarRows.at(index - 2) ?? 44}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </aside>

        <main className="tw-flex tw-min-w-0 tw-flex-1 tw-flex-col tw-bg-iron-950">
          <div className="tw-flex tw-items-center tw-gap-3 tw-border-b tw-border-iron-900 tw-px-4 tw-py-3">
            <SkeletonBlock className="tw-size-9 tw-shrink-0 tw-rounded-full md:tw-hidden" />
            <div className="tw-min-w-0 tw-flex-1">
              <SkeletonBlock className="tw-h-5" style={{ width: "48%" }} />
              <SkeletonBlock className="tw-mt-3 tw-h-3" style={{ width: "28%" }} />
            </div>
          </div>

          <div className="tw-flex tw-flex-1 tw-flex-col tw-gap-4 tw-overflow-hidden tw-px-4 tw-py-4 md:tw-px-6">
            {contentRows.map((width, index) => (
              <div
                key={width}
                className="tw-flex tw-gap-3 tw-rounded-md tw-bg-iron-900/45 tw-p-4">
                <SkeletonBlock className="tw-size-9 tw-shrink-0 tw-rounded-full" />
                <div className="tw-min-w-0 tw-flex-1">
                  <SkeletonBlock
                    className="tw-h-3.5"
                    style={{ width: `${width}%` }}
                  />
                  <SkeletonBlock
                    className="tw-mt-3 tw-h-3"
                    style={{ width: `${contentRows.at(index - 1) ?? 52}%` }}
                  />
                  <SkeletonBlock
                    className="tw-mt-4 tw-h-10"
                    style={{ width: index % 2 === 0 ? "100%" : "76%" }}
                  />
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
