import { CollectedCard } from "../../../../entities/IProfile";

export default function UserPageCollectedCards({
  cards,
}: {
  readonly cards: CollectedCard[];
}) {
  return (
    <div className="tw-grid tw-grid-cols-4 tw-gap-6 tw-pb-2">
      {cards.map((card) => {
        return (
          <div
            key={card.token_id}
            className="tw-p-2 tw-bg-iron-900 tw-rounded-lg tw-ring-1 tw-ring-inset tw-ring-iron-800"
          >
            <a className="tw-w-full tw-max-w-full">
              <div className="tw-h-[300px] tw-text-center tw-flex">
                <img
                  src={card.img}
                  alt=""
                  className="tw-bg-transparent tw-max-h-full tw-max-w-full tw-h-auto tw-w-auto tw-align-middle tw-mx-auto tw-object-contain"
                />
              </div>
            </a>

            <div className="tw-pt-3 tw-pb-2 tw-px-2 tw-flex tw-justify-between">
              <span className="tw-text-md tw-font-semibold tw-text-iron-200">
                {card.token_name}
              </span>
              <span className="tw-text-md tw-font-semibold tw-text-iron-400">
                {card.szn}
              </span>
            </div>
            <div className="tw-hidden">
              {card.collection} - {card.token_id} - {card.token_name} -{" "}
              {card.tdh} - {card.rank} {card.seized_count} -
            </div>
          </div>
        );
      })}
    </div>
  );
}
