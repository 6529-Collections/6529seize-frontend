import type { CSSProperties } from "react";
import WaveChatLoading from "@/components/waves/WaveChatLoading";

interface StreamRouteLoadingShellProps {
  readonly ariaLabel: string;
  readonly variant: "wave" | "waves" | "messages";
  readonly showSidebar?: boolean;
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
  animate = true,
}: {
  readonly className: string;
  readonly style?: CSSProperties | undefined;
  readonly animate?: boolean;
}) => (
  <div
    aria-hidden="true"
    className={`tw-rounded-md tw-bg-iron-800/80 ${animate ? "motion-safe:tw-animate-pulse" : ""} ${className}`}
    style={style}
  />
);

export default function StreamRouteLoadingShell({
  ariaLabel,
  variant,
  showSidebar = true,
}: StreamRouteLoadingShellProps) {
  const primaryWidth = variant === "messages" ? "56%" : "68%";
  const secondaryWidth = variant === "messages" ? "42%" : "50%";

  return (
    <div
      className="tailwind-scope tw-w-full tw-min-w-0 tw-flex-1 tw-bg-black tw-text-iron-50"
      style={routeLoadingMinHeightStyle}
      data-testid="stream-route-loading-shell"
    >
      {variant !== "wave" && (
        <output className="tw-sr-only" aria-label={ariaLabel}>
          {ariaLabel}
        </output>
      )}
      <div
        className="tw-flex tw-min-w-0 tw-overflow-hidden"
        style={routeLoadingMinHeightStyle}
      >
        {showSidebar && (
          <aside
            className={`tw-hidden tw-w-80 tw-shrink-0 tw-border-r tw-border-iron-900 tw-bg-iron-950 ${variant === "messages" ? "md:tw-flex md:tw-flex-col" : "lg:tw-flex lg:tw-flex-col"}`}
          >
            <div className="tw-border-b tw-border-iron-900 tw-px-4 tw-py-4">
              <SkeletonBlock
                animate={variant !== "wave"}
                className="tw-h-5"
                style={{ width: primaryWidth }}
              />
              <SkeletonBlock
                animate={variant !== "wave"}
                className="tw-mt-3 tw-h-3"
                style={{ width: secondaryWidth }}
              />
            </div>
            <div className="tw-space-y-3 tw-p-3">
              {sidebarRows.map((width, index) => (
                <div
                  key={width}
                  className="tw-flex tw-items-center tw-gap-3 tw-rounded-md tw-bg-iron-900/55 tw-p-3"
                >
                  <SkeletonBlock
                    animate={variant !== "wave"}
                    className="tw-size-10 tw-shrink-0 tw-rounded-full"
                  />
                  <div className="tw-min-w-0 tw-flex-1">
                    <SkeletonBlock
                      animate={variant !== "wave"}
                      className="tw-h-3"
                      style={{ width: `${width}%` }}
                    />
                    <SkeletonBlock
                      animate={variant !== "wave"}
                      className="tw-mt-3 tw-h-2.5"
                      style={{ width: `${sidebarRows.at(index - 2) ?? 44}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </aside>
        )}

        <main className="tw-flex tw-min-w-0 tw-flex-1 tw-flex-col tw-bg-iron-950">
          {variant === "wave" ? (
            <WaveChatLoading status={ariaLabel} />
          ) : (
            <>
              <div className="tw-flex tw-items-center tw-gap-3 tw-border-b tw-border-iron-900 tw-px-4 tw-py-3">
                <SkeletonBlock className="tw-size-9 tw-shrink-0 tw-rounded-full md:tw-hidden" />
                <div className="tw-min-w-0 tw-flex-1">
                  <SkeletonBlock className="tw-h-5" style={{ width: "48%" }} />
                  <SkeletonBlock
                    className="tw-mt-3 tw-h-3"
                    style={{ width: "28%" }}
                  />
                </div>
              </div>

              <div className="tw-flex tw-flex-1 tw-flex-col tw-gap-4 tw-overflow-hidden tw-px-4 tw-py-4 md:tw-px-6">
                {contentRows.map((width, index) => (
                  <div
                    key={width}
                    className="tw-flex tw-gap-3 tw-rounded-md tw-bg-iron-900/45 tw-p-4"
                  >
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
            </>
          )}
        </main>
      </div>
    </div>
  );
}
