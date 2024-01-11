export default function UserPageRepNewRepError({
  msg,
}: {
  readonly msg: string;
}) {
  return (
    <div className="tw-w-full md:tw-w-auto tw-inline-flex tw-items-center tw-rounded-lg tw-bg-red/5 tw-border tw-border-solid tw-border-red/30 tw-p-4">
      <div className="tw-flex">
        <svg
          className="tw-flex-shrink-0 tw-w-5 tw-h-5 tw-text-red"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M11.9998 8.99999V13M11.9998 17H12.0098M10.6151 3.89171L2.39019 18.0983C1.93398 18.8863 1.70588 19.2803 1.73959 19.6037C1.769 19.8857 1.91677 20.142 2.14613 20.3088C2.40908 20.5 2.86435 20.5 3.77487 20.5H20.2246C21.1352 20.5 21.5904 20.5 21.8534 20.3088C22.0827 20.142 22.2305 19.8857 22.2599 19.6037C22.2936 19.2803 22.0655 18.8863 21.6093 18.0983L13.3844 3.89171C12.9299 3.10654 12.7026 2.71396 12.4061 2.58211C12.1474 2.4671 11.8521 2.4671 11.5935 2.58211C11.2969 2.71396 11.0696 3.10655 10.6151 3.89171Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <div className="tw-ml-3 tw-self-center tw-flex tw-flex-col lg:tw-max-w-xl">
          <h3 className="tw-text-sm tw-mb-0 tw-font-semibold tw-text-red">
            {msg}
          </h3>
          <div>
            <p className="tw-text-justify tw-mt-2 tw-mb-0 tw-text-sm tw-text-iron-300 tw-font-normal">
              Rep is not meant for insults or doxxing so we run proposed rep
              categories through an AI filter. If you think the filter got your
              proposed category wrong, hop into Discord and let us know. In the
              meantime, perhaps you can rephrase that you are trying to say.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
