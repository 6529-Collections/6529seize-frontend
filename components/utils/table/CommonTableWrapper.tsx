export default function CommonTableWrapper({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  return (
    <div className="tailwind-scope tw-mt-2 lg:tw-mt-4 tw-flow-root">
      <div className="tw-bg-iron-950/50 tw-overflow-x-auto tw-shadow tw-ring-1 tw-ring-iron-800 tw-rounded-lg tw-divide-y tw-divide-solid tw-divide-iron-800 tw-scrollbar-thin tw-scrollbar-thumb-iron-500 tw-scrollbar-track-iron-800 desktop-hover:hover:tw-scrollbar-thumb-iron-300">
        <table className="tw-min-w-full">{children}</table>
      </div>
    </div>
  );
}
