import DropAuthor from "./DropAuthor";
import DropPfp from "./DropPfp";

export default function DropWrapper({
  pfpUrl,
  handle,
  timestamp,
  children,
}: {
  readonly pfpUrl?: string | null;
  readonly handle: string;
  readonly timestamp: number;
  readonly children: React.ReactNode;
}) {
  return (
    <div className="tw-flex tw-gap-x-3">
      <DropPfp pfpUrl={pfpUrl} />
      <div className="tw-flex tw-flex-col tw-w-full">
        <DropAuthor handle={handle} timestamp={timestamp} />
        <div className="tw-mt-1 tw-w-full">{children}</div>
        <div className="tw-mt-4 tw-flex tw-w-full tw-justify-between tw-items-end">
          <div className="tw-flex tw-flex-col">
            <div className="isolate flex -space-x-1 overflow-hidden">
              <img
                className="tw-flex-shrink-0 tw-relative tw-z-30 tw-inline-block tw-h-6 tw-w-6 tw-rounded-full tw-ring-2 tw-ring-black tw-bg-iron-800"
                src="https://images.unsplash.com/photo-1491528323818-fdd1faba62cc?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                alt=""
              />
               <img
                className="tw-flex-shrink-0 tw-relative tw-z-30 tw-inline-block tw-h-6 tw-w-6 tw-rounded-full tw-ring-2 tw-ring-black tw-bg-iron-800"
                src="https://images.unsplash.com/photo-1491528323818-fdd1faba62cc?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                alt=""
              />
               <img
                className="tw-flex-shrink-0 tw-relative tw-z-30 tw-inline-block tw-h-6 tw-w-6 tw-rounded-full tw-ring-2 tw-ring-black tw-bg-iron-800"
                src="https://images.unsplash.com/photo-1491528323818-fdd1faba62cc?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                alt=""
              />
            </div>
            <div className="tw-mt-2 tw-flex tw-items-center tw-gap-2">
              <div className="tw-px-2 tw-py-1 tw-flex tw-items-center tw-gap-x-1 tw-justify-center tw-rounded-full tw-ring-1 tw-ring-inset tw-ring-iron-700 tw-bg-iron-700 tw-text-iron-300 tw-font-normal tw-text-xxs">
                <span>Rep</span>
                <span className="tw-text-green tw-font-medium">+1434</span>
              </div>
              <div className="tw-px-2 tw-py-1 tw-flex tw-items-center tw-justify-center tw-gap-x-1 tw-rounded-full tw-ring-1 tw-ring-inset tw-ring-iron-700 tw-bg-iron-700 tw-text-iron-300 tw-font-normal tw-text-xxs">
                <span>Cool art</span>
                <span className="tw-text-green tw-font-medium">+67</span>
              </div>
              <div className="tw-px-2 tw-py-1 tw-flex tw-items-center tw-justify-center tw-gap-x-1 tw-rounded-full tw-ring-1 tw-ring-inset tw-ring-iron-700 tw-bg-iron-700 tw-text-iron-300 tw-font-normal tw-text-xxs">
                <span>Grail</span>
                <span className="tw-text-red tw-font-medium">-67</span>
              </div>
            </div>
          </div>
          <div className="tw-flex tw-flex-col tw-items-center tw-gap-y-1">
            <button
              type="button"
              aria-label="Choose positive rep"
              className="tw-flex tw-items-center tw-justify-center tw-border-0 tw-rounded-full tw-bg-iron-700 tw-ring-1 tw-ring-inset tw-ring-white/10 tw-h-6 tw-w-6 tw-text-white tw-shadow-sm hover:tw-bg-iron-600 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-iron-600 tw-transition-all tw-duration-300 tw-ease-out"
            >
              <svg
                className="tw-flex-shrink-0 tw-h-4 tw-w-4"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M18 15L12 9L6 15"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <button
              type="button"
              aria-label="Give rep"
              className="tw-flex tw-items-center tw-justify-center tw-text-xxs tw-font-medium tw-border-0 tw-rounded-full tw-bg-green/[0.15] tw-ring-1 tw-ring-inset tw-ring-green/[0.20] tw-min-w-[2rem] 
              tw-h-8 tw-text-white tw-shadow-sm hover:tw-scale-110 tw-transform focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-ring-300  tw-transition-all tw-duration-300 tw-ease-out"
            >
              <span className="tw-text-green">1</span>
              {/*    <span className="tw-text-red">1</span> */}
            </button>
            <button
              type="button"
              aria-label="Choose negative rep"
              className="tw-flex tw-items-center tw-justify-center tw-border-0 tw-rounded-full tw-bg-iron-700 tw-ring-1 tw-ring-inset tw-ring-white/10 tw-h-6 tw-w-6 tw-text-white tw-shadow-sm hover:tw-bg-iron-600 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-ring-400 tw-transition-all tw-duration-300 tw-ease-out"
            >
              <svg
                className="tw-flex-shrink-0 tw-h-4 tw-w-4"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M6 9L12 15L18 9"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
