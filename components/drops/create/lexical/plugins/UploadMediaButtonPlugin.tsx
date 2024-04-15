import { getRandomObjectId } from "../../../../../helpers/AllowlistToolHelpers";

export default function UploadMediaButtonPlugin({
  onFileChange,
}: {
  readonly onFileChange: (file: File) => void;
}) {
  const id = getRandomObjectId();
  return (
    <label
      htmlFor={id}
      className="tw-absolute tw-flex tw-items-center tw-justify-center tw-inset-y-0 tw-right-12 tw-p-2 tw-rounded-lg"
    >
      <svg
        className="tw-cursor-pointer tw-h-5 tw-w-5 tw-text-iron-400 hover:tw-text-iron-50 tw-ease-out tw-transition tw-duration-30"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M21.1525 10.8995L12.1369 19.9151C10.0866 21.9653 6.7625 21.9653 4.71225 19.9151C2.662 17.8648 2.662 14.5407 4.71225 12.4904L13.7279 3.47483C15.0947 2.108 17.3108 2.108 18.6776 3.47483C20.0444 4.84167 20.0444 7.05775 18.6776 8.42458L10.0156 17.0866C9.33213 17.7701 8.22409 17.7701 7.54068 17.0866C6.85726 16.4032 6.85726 15.2952 7.54068 14.6118L15.1421 7.01037"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <input
        id={id}
        type="file"
        className="tw-hidden"
        accept="image/*,video/*,audio/*"
        onChange={(e: any) => {
          if (e.target.files) {
            const f = e.target.files[0];
            onFileChange(f);
          }
        }}
      />
    </label>
  );
}
