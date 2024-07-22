import Link from "next/link";
import { Wave } from "../../../generated/models/Wave";
import { getRandomColorWithSeed } from "../../../helpers/Helpers";
import DropPart, { DropPartSize } from "../../drops/view/part/DropPart";

export default function WaveItem({ wave }: { readonly wave: Wave }) {
  const banner1 =
    wave.author.banner1_color ?? getRandomColorWithSeed(wave.author.handle);
  const banner2 =
    wave.author.banner2_color ?? getRandomColorWithSeed(wave.author.handle);
  return (
    <div className="tw-pb-4 tw-relative tw-bg-iron-900 tw-rounded-xl tw-border tw-border-solid tw-border-iron-800">
      <div
        className="tw-relative tw-w-full tw-h-9 tw-rounded-t-xl"
        style={{
          background: `linear-gradient(45deg, ${banner1} 0%, ${banner2} 100%)`,
        }}
      ></div>
      <div className="tw-flex tw-gap-x-2 tw-px-4">
        <div className="-tw-mt-4 tw-relative tw-flex-shrink-0">
          <div className="tw-h-14 tw-w-14">
            {wave.picture ? (
              <img
                className="tw-flex-shrink-0 tw-object-contain tw-h-full tw-w-full tw-rounded-full tw-bg-iron-700 tw-border-[3px] tw-border-solid tw-border-iron-900"
                src={wave.picture}
                alt="#"
              />
            ) : (
              <div className="tw-flex-shrink-0 tw-object-contain tw-h-full tw-w-full tw-rounded-full tw-bg-iron-700 tw-border-[3px] tw-border-solid tw-border-iron-900" />
            )}
          </div>
        </div>
        <div className="tw-mt-2">
          <Link
            href={`/waves/${wave.id}`}
            className="tw-no-underline tw-text-lg tw-font-semibold tw-text-white"
          >
            {wave.name}
          </Link>
        </div>
      </div>
      <div className="tw-mt-4 tw-px-4">
        <div className="tw-flex tw-items-center tw-gap-x-2">
          <div className="tw-h-6 tw-w-6">
            {wave.picture ? (
              <img
                className="tw-flex-shrink-0 tw-object-contain tw-h-full tw-w-full tw-rounded-md tw-bg-iron-800 tw-ring-1 tw-ring-iron-700"
                src={wave.picture}
                alt="#"
              />
            ) : (
              <div className="tw-flex-shrink-0 tw-object-contain tw-h-full tw-w-full tw-rounded-md tw-bg-iron-800 tw-ring-1 tw-ring-iron-700" />
            )}
          </div>
          <span className="tw-text-sm tw-font-semibold tw-text-white">
            punk6529
          </span>
          <div className="tw-border-none tw-inline-flex tw-items-center tw-rounded-xl tw-bg-transparent tw-px-2 tw-py-1 tw-font-semibold tw-ring-2 tw-ring-inset tw-text-[#55B075] tw-ring-[#55B075] tw-text-[0.625rem] tw-leading-3">
            Level 88
          </div>
        </div>
        <div className="tw-flex tw-items-center tw-justify-between tw-mt-6">
          <div className="tw-text-sm tw-flex tw-items-center tw-gap-x-2 tw-text-iron-300">
            <svg
              className="tw-h-5 tw-w-5 tw-flex-shrink-0 tw-text-iron-300"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              aria-hidden="true"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.068.157 2.148.279 3.238.364.466.037.893.281 1.153.671L12 21l2.652-3.978c.26-.39.687-.634 1.153-.67 1.09-.086 2.17-.208 3.238-.365 1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z"
              />
            </svg>
            <span>Chat</span>
          </div>
          <div className="tw-text-sm tw-flex tw-items-center tw-gap-x-2 tw-text-iron-300">
            <svg
              className="tw-h-5 tw-w-5 tw-flex-shrink-0 tw-text-iron-300"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              aria-hidden="true"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z"
              />
            </svg>
            <span>
              <span>420</span> <span className="tw-text-iron-400">Joined</span>
            </span>
          </div>
          <div className="tw-text-sm tw-flex tw-items-center tw-gap-x-2 tw-text-iron-300">
            <svg
              className="tw-h-5 tw-w-5 tw-flex-shrink-0 tw-text-iron-300"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              aria-hidden="true"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6.75 2.994v2.25m10.5-2.25v2.25m-14.252 13.5V7.491a2.25 2.25 0 0 1 2.25-2.25h13.5a2.25 2.25 0 0 1 2.25 2.25v11.251m-18 0a2.25 2.25 0 0 0 2.25 2.25h13.5a2.25 2.25 0 0 0 2.25-2.25m-18 0v-7.5a2.25 2.25 0 0 1 2.25-2.25h13.5a2.25 2.25 0 0 1 2.25 2.25v7.5m-6.75-6h2.25m-9 2.25h4.5m.002-2.25h.005v.006H12v-.006Zm-.001 4.5h.006v.006h-.006v-.005Zm-2.25.001h.005v.006H9.75v-.006Zm-2.25 0h.005v.005h-.006v-.005Zm6.75-2.247h.005v.005h-.005v-.005Zm0 2.247h.006v.006h-.006v-.006Zm2.25-2.248h.006V15H16.5v-.005Z"
              />
            </svg>
            <span>
              <span className="tw-text-iron-400">Ending in</span>{" "}
              <span>7 days</span>
            </span>
          </div>
        </div>
        <div className="tw-flex tw-items-center tw-mt-6">
          <div className="tw-flex tw-items-center tw-gap-x-2">
            <div className="tw-flex -tw-space-x-1">
              <div className="tw-h-6 tw-w-6">
                <img
                  className="tw-flex-shrink-0 tw-object-contain tw-h-full tw-w-full tw-rounded-md tw-bg-iron-700 tw-ring-[1.5px] tw-ring-black"
                  src="https://cdn.iconscout.com/icon/free/png-256/ethereum-1-283135.png"
                  alt="#"
                />
              </div>
              <div className="tw-h-6 tw-w-6">
                <img
                  className="tw-flex-shrink-0 tw-object-contain tw-h-full tw-w-full tw-rounded-md tw-bg-iron-700 tw-ring-[1.5px] tw-ring-black"
                  src="https://cdn.iconscout.com/icon/free/png-256/ethereum-1-283135.png"
                  alt="#"
                />
              </div>
              <div className="tw-h-6 tw-w-6">
                <img
                  className="tw-flex-shrink-0 tw-object-contain tw-h-full tw-w-full tw-rounded-md tw-bg-iron-700 tw-ring-[1.5px] tw-ring-black"
                  src="https://cdn.iconscout.com/icon/free/png-256/ethereum-1-283135.png"
                  alt="#"
                />
              </div>
            </div>
            <span className="tw-text-sm">
              <span className="tw-text-iron-300">+1,123</span>{" "}
              <span className="tw-text-iron-400">Drops</span>
            </span>
          </div>
          <div className="tw-flex tw-items-center tw-gap-x-3 tw-ml-auto">
            <button
              type="button"
              className="tw-border tw-border-solid tw-border-iron-700 tw-rounded-lg tw-bg-iron-800 tw-px-3.5 tw-py-2.5 tw-text-sm tw-font-semibold tw-text-iron-300 tw-shadow-sm hover:tw-bg-iron-700 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-iron-700 tw-transition tw-duration-300 tw-ease-out"
            >
              <svg
                className="tw-h-5 tw-w-5"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                aria-hidden="true"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                />
              </svg>
            </button>
            <button
              type="button"
              className="tw-flex tw-items-center tw-whitespace-nowrap tw-border tw-border-solid tw-border-primary-500 tw-rounded-lg tw-bg-primary-500 tw-px-3.5 tw-py-2.5 tw-text-sm tw-font-semibold tw-text-white tw-shadow-sm hover:tw-bg-primary-600 hover:tw-border-primary-600 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-600 tw-transition tw-duration-300 tw-ease-out"
            >
              <span>JOIN</span>
            </button>
          </div>
        </div>
      </div>

      {/*   <div className="tw-mt-4 tw-px-4 tw-flex tw-items-center tw-gap-x-3">
        <div className="tw-px-4 tw-py-4 tw-w-full tw-rounded-lg tw-bg-iron-800">
          <DropPart
            profile={wave.author}
            mentionedUsers={wave.description_drop.mentioned_users}
            referencedNfts={wave.description_drop.referenced_nfts}
            partContent={wave.description_drop.parts[0].content ?? null}
            partMedia={
              wave.description_drop.parts[0].media[0]
                ? {
                    mimeType: wave.description_drop.parts[0].media[0].mime_type,
                    mediaSrc: wave.description_drop.parts[0].media[0].url,
                  }
                : null
            }
            showFull={false}
            createdAt={wave.description_drop.created_at}
            dropTitle={wave.description_drop.title}
            wave={null}
            size={DropPartSize.SMALL}
          />
        </div>
      </div> */}
    </div>
  );
}
