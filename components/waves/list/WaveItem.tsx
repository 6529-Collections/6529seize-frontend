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
        className="tw-relative tw-w-full tw-h-10 tw-rounded-t-xl"
        style={{
          background: `linear-gradient(45deg, ${banner1} 0%, ${banner2} 100%)`,
        }}
      ></div>
      <div className="-tw-mt-4 tw-flex-shrink-0 tw-px-4">
        <div className="tw-h-10 tw-w-10">
          {wave.picture ? (
            <img
              className="tw-flex-shrink-0 tw-object-contain tw-h-full tw-w-full tw-rounded-md tw-bg-iron-700 tw-border-[3px] tw-border-solid tw-border-iron-900"
              src={wave.picture}
              alt="#"
            />
          ) : (
            <div className="tw-flex-shrink-0 tw-object-contain tw-h-full tw-w-full tw-rounded-md tw-bg-iron-700 tw-border-[3px] tw-border-solid tw-border-iron-900" />
          )}
        </div>
      </div>
      <div className="tw-flex tw-items-center tw-gap-x-3 tw-justify-between tw-px-4">
        <Link
          href={`/waves/${wave.id}`}
          className="tw-no-underline tw-text-lg tw-font-semibold tw-text-white"
        >
          {wave.name}
        </Link>
        <button
          type="button"
          className="tw-flex tw-items-center tw-whitespace-nowrap tw-border tw-border-solid tw-border-primary-500 tw-rounded-lg tw-bg-primary-500 tw-px-3.5 tw-py-2.5 tw-text-sm tw-font-semibold tw-text-white tw-shadow-sm hover:tw-bg-primary-600 hover:tw-border-primary-600 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-600 tw-transition tw-duration-300 tw-ease-out"
        >
          <span>Join</span>
        </button>
      </div>
      <div className="tw-mt-4 tw-px-4 tw-flex tw-items-center tw-gap-x-3">
        <div className="tw-px-4 tw-py-4 tw-w-full tw-rounded-lg tw-bg-iron-800">
          <DropPart
            profile={wave.author}
            mentionedUsers={wave.description_drop.mentioned_users}
            referencedNfts={wave.description_drop.referenced_nfts}
            partContent={wave.description_drop.parts[0].content ?? null}
            smallMenuIsShown={false}
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
      </div>
    </div>
  );
}
