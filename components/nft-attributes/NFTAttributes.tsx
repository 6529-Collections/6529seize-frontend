import type { IAttribute } from "@/entities/INFT";

export default function NFTAttributes(
  props: Readonly<{
    attributes: IAttribute[];
  }>
) {
  return (
    <div className="tw-grid tw-grid-cols-2 sm:tw-grid-cols-4 md:tw-grid-cols-6 lg:tw-grid-cols-6">
      {props.attributes.map((a: any) => (
        <div key={a.trait_type} className="tw-py-2">
          <div className="tw-px-3">
            <div className="tw-overflow-hidden tw-text-ellipsis tw-whitespace-nowrap tw-rounded-md tw-border tw-border-solid tw-border-white tw-py-2 tw-text-center">
              <span className="tw-whitespace-nowrap tw-text-[13px]">
                {a.trait_type}
              </span>
              <br />
              <span
                className="tw-whitespace-nowrap tw-text-[15px] tw-font-bold"
                title={a.value}
              >
                {a.value}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
