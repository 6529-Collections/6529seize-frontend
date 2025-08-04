import useIsMobileScreen from "../../../hooks/isMobileScreen";

export default function CreateWaveFlow({
  title,
  onBack,
  children,
}: {
  readonly title: string;
  readonly onBack: () => void;
  readonly children: React.ReactNode;
}) {
  const isMobile = useIsMobileScreen();

  return (
    <div className="tailwind-scope tw-bg-iron-950 tw-mt-6 lg:tw-mt-8 tw-pb-16 lg:tw-pb-28 tw-px-4 xl:tw-px-0 min-[992px]:tw-max-w-[960px] max-[1100px]:tw-max-w-[950px] min-[1200px]:tw-max-w-[1050px] min-[1300px]:tw-max-w-[1150px] min-[1400px]:tw-max-w-[1250px] min-[1500px]:tw-max-w-[1280px] tw-mx-auto tw-min-h-screen">
      <div className="tw-h-full tw-w-full">
        <div className="xl:tw-max-w-[60rem] tw-mx-auto">
          <button
            onClick={onBack}
            type="button"
            className="tw-py-2 tw-px-2 -tw-ml-2 tw-flex tw-items-center tw-gap-x-2 tw-justify-center tw-text-sm tw-font-semibold tw-border-0 tw-rounded-lg tw-transition tw-duration-300 tw-ease-out tw-cursor-pointer tw-text-iron-400 tw-bg-transparent hover:tw-text-iron-50">
            <svg
              className="tw-flex-shrink-0 tw-w-5 tw-h-5"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg">
              <path
                d="M20 12H4M4 12L10 18M4 12L10 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"></path>
            </svg>
            <span>All Waves</span>
          </button>
          <div
            className={`tw-mb-0 tw-font-bold ${
              isMobile ? "tw-text-3xl" : "tw-text-5xl"
            }`}>
            {title}
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
