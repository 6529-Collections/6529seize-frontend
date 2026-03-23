const PREVIEW_ROWS = [
  {
    id: "preview-1",
    nameWidth: "tw-w-24",
    timeWidth: "tw-w-12",
    lines: ["tw-w-5/6", "tw-w-2/5"],
    hasAttachment: false,
    reactions: 0,
    opacityClass: "tw-opacity-90",
  },
  {
    id: "preview-2",
    nameWidth: "tw-w-32",
    timeWidth: "tw-w-16",
    lines: ["tw-w-11/12", "tw-w-full", "tw-w-4/5", "tw-w-3/5"],
    hasAttachment: true,
    reactions: 2,
    opacityClass: "tw-opacity-60",
  },
  {
    id: "preview-3",
    nameWidth: "tw-w-20",
    timeWidth: "tw-w-10",
    lines: ["tw-w-1/3"],
    hasAttachment: false,
    reactions: 1,
    opacityClass: "tw-opacity-90",
  },
  {
    id: "preview-4",
    nameWidth: "tw-w-28",
    timeWidth: "tw-w-14",
    lines: ["tw-w-3/4", "tw-w-5/6", "tw-w-2/5"],
    hasAttachment: false,
    reactions: 0,
    opacityClass: "tw-opacity-60",
  },
  {
    id: "preview-5",
    nameWidth: "tw-w-36",
    timeWidth: "tw-w-12",
    lines: ["tw-w-3/5"],
    hasAttachment: true,
    reactions: 3,
    opacityClass: "tw-opacity-90",
  },
  {
    id: "preview-6",
    nameWidth: "tw-w-24",
    timeWidth: "tw-w-12",
    lines: ["tw-w-full", "tw-w-4/5", "tw-w-11/12", "tw-w-1/5"],
    hasAttachment: false,
    reactions: 0,
    opacityClass: "tw-opacity-60",
  },
  {
    id: "preview-7",
    nameWidth: "tw-w-20",
    timeWidth: "tw-w-14",
    lines: ["tw-w-1/2"],
    hasAttachment: false,
    reactions: 0,
    opacityClass: "tw-opacity-90",
  },
] as const;

const REACTION_KEYS = ["first", "second", "third", "fourth"] as const;

function SkeletonRows({ rowKeyPrefix }: { readonly rowKeyPrefix: string }) {
  return (
    <>
      {PREVIEW_ROWS.map((row) => (
        <div
          key={`${rowKeyPrefix}-${row.id}`}
          className={`tw-mx-auto tw-flex tw-w-full tw-max-w-5xl tw-items-start tw-gap-4 ${row.opacityClass}`}
        >
          <div className="tw-size-11 tw-flex-shrink-0 tw-rounded-full tw-bg-iron-600 tw-shadow-sm" />

          <div className="tw-flex-1 tw-space-y-1.5 tw-pt-0.5">
            <div className="tw-mb-2 tw-flex tw-items-baseline tw-gap-3">
              <div
                className={`tw-h-3.5 tw-rounded-md tw-bg-iron-500 ${row.nameWidth}`}
              />
              <div
                className={`tw-h-2.5 tw-rounded-md tw-bg-iron-700 ${row.timeWidth}`}
              />
            </div>

            <div className="tw-w-full tw-space-y-2.5">
              {row.lines.map((lineWidth) => (
                <div
                  key={lineWidth}
                  className={`tw-h-3 tw-rounded-sm tw-bg-iron-500 ${lineWidth}`}
                />
              ))}
            </div>

            {row.hasAttachment && (
              <div className="tw-mt-3 tw-h-48 tw-w-full tw-max-w-80 tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-800 tw-shadow-sm" />
            )}

            {row.reactions > 0 && (
              <div className="tw-flex tw-gap-2 tw-pt-2">
                {REACTION_KEYS.slice(0, row.reactions).map((reactionKey) => (
                  <div
                    key={reactionKey}
                    className="tw-h-6 tw-w-10 tw-rounded-full tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-800"
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
    </>
  );
}

function PlaceholderSkeleton() {
  return (
    <div className="tw-flex tw-h-full tw-select-none tw-flex-col tw-opacity-50 tw-blur-md">
      <div className="tw-flex-1 tw-overflow-hidden">
        <div className="tw-flex tw-h-full tw-flex-col tw-justify-end tw-gap-6">
          <SkeletonRows rowKeyPrefix="primary" />
          <SkeletonRows rowKeyPrefix="extended" />
        </div>
      </div>

      <div className="tw-pt-8">
        <div className="tw-mx-auto tw-w-full tw-max-w-5xl tw-rounded-xl tw-border tw-border-solid tw-border-iron-800/80 tw-bg-black/35 tw-p-3.5 tw-shadow-[0_24px_60px_rgba(0,0,0,0.4)]">
          <div className="tw-flex tw-items-end tw-gap-3">
            <div className="tw-flex-1 tw-rounded-xl tw-border tw-border-solid tw-border-iron-600 tw-bg-iron-800/95 tw-p-3 tw-shadow-sm">
              <div className="tw-mb-3 tw-space-y-2">
                <div className="tw-h-3 tw-w-2/5 tw-rounded-sm tw-bg-iron-400" />
                <div className="tw-h-3 tw-w-1/3 tw-rounded-sm tw-bg-iron-600" />
              </div>

              <div className="tw-flex tw-items-center tw-justify-between tw-gap-3">
                <div className="tw-flex tw-items-center tw-gap-2">
                  <div className="tw-h-8 tw-w-8 tw-rounded-full tw-bg-iron-700" />
                  <div className="tw-h-8 tw-w-8 tw-rounded-full tw-bg-iron-700" />
                  <div className="tw-h-8 tw-w-20 tw-rounded-full tw-bg-iron-700" />
                </div>

                <div className="tw-h-7 tw-w-7 tw-rounded-full tw-bg-iron-700" />
              </div>
            </div>

            <div className="tw-flex tw-h-11 tw-w-11 tw-flex-shrink-0 tw-rounded-xl tw-border tw-border-solid tw-border-iron-600 tw-bg-iron-700" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoggedOutSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="tw-pointer-events-none tw-absolute tw-inset-0 tw-overflow-hidden"
    >
      <div className="tw-absolute tw-left-1/4 tw-top-1/4 tw-size-96 tw-rounded-full tw-bg-white/5 tw-mix-blend-screen tw-blur-3xl" />
      <div className="tw-absolute tw-bottom-1/4 tw-right-1/4 tw-size-96 tw-scale-125 tw-rounded-full tw-bg-iron-400/5 tw-mix-blend-screen tw-blur-3xl" />

      <div className="tw-absolute tw-inset-0 tw-overflow-hidden tw-p-6 md:tw-p-8">
        <PlaceholderSkeleton />
      </div>

      <div className="tw-absolute tw-inset-0 tw-bg-gradient-to-b tw-from-black/60 tw-via-black/30 tw-to-black" />
    </div>
  );
}
