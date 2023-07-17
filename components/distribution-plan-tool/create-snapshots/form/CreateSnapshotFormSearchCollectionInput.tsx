import { useRef } from "react";

export default function CreateSnapshotFormSearchCollectionInput({
  keyword,
  setKeyword,
  openDropdown,
}: {
  keyword: string;
  setKeyword: (kw: string) => void;
  openDropdown: () => void;
}) {
  const handleKeywordChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;
    setKeyword(value);
  };
  return (
    <div className="tw-max-w-md">
      <div className="tw-pointer-events-none tw-absolute tw-inset-y-0 tw-flex tw-items-center tw-pl-3">
        <svg
          className="tw-h-5 tw-w-5 tw-text-neutral-300"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M21 21L16.65 16.65M19 11C19 15.4183 15.4183 19 11 19C6.58172 19 3 15.4183 3 11C3 6.58172 6.58172 3 11 3C15.4183 3 19 6.58172 19 11Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <input
        onClick={openDropdown}
        type="text"
        name="name"
        placeholder="Search NFT collection"
        value={keyword}
        onChange={handleKeywordChange}
        autoComplete="off"
        className="tw-block tw-w-full tw-rounded-lg tw-pl-10 tw-border-0 tw-py-3 tw-px-3 tw-bg-neutral-700/40 focus:tw-bg-transparent tw-text-white tw-font-light tw-caret-primary-400 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-neutral-700/40 placeholder:tw-text-neutral-500 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 tw-text-base sm:tw-leading-6 tw-transition tw-duration-300 tw-ease-out"
      />
    </div>
  );
}
