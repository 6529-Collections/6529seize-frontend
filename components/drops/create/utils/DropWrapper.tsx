import { Drop } from "../../../../generated/models/Drop";
import DropAuthor from "./author/DropAuthor";
import DropPfp from "./DropPfp";

export default function DropWrapper({
  drop,
  children,
  isWaveDescriptionDrop = false,
}: {
  readonly drop: Drop;
  readonly isWaveDescriptionDrop?: boolean;
  readonly children: React.ReactNode;
}) {
  return (
    <div className="tw-flex tw-gap-x-3 tw-h-full">
      <div className="tw-hidden sm:tw-block">
        <DropPfp
          pfpUrl={drop.author.pfp}
          isWaveDescriptionDrop={isWaveDescriptionDrop}
        />
      </div>
      <div className="tw-flex tw-flex-col tw-w-full tw-h-full">
        <div className="tw-flex tw-gap-x-3">
          <div className="sm:tw-hidden">
            <DropPfp
              pfpUrl={drop.author.pfp}
              isWaveDescriptionDrop={isWaveDescriptionDrop}
            />
          </div>
          <div className="tw-flex tw-flex-col tw-gap-y-2">
            <div className="tw-w-full tw-inline-flex tw-justify-between">
              <DropAuthor profile={drop.author} timestamp={drop.created_at} />
            </div>
            <div className="tw-flex tw-gap-x-1 tw-items-center">
              <div className="tw-h-6 tw-w-6">
                <img
                  alt="#"
                  className="tw-bg-transparent tw-max-w-full tw-max-h-full tw-h-auto tw-w-auto tw-mx-auto tw-object-contain tw-rounded-lg"
                />
              </div>
              <div className="tw-text-xs tw-font-normal tw-text-primary-300">
                Wave name
              </div>
            </div>
          </div>
        </div>

        <div className="tw-mt-2 lg:tw-mt-1 tw-h-full">
          {drop.title && (
            <p className="tw-font-semibold tw-text-indigo-400 tw-text-md tw-mb-1">
              {drop.title}
            </p>
          )}
          <div className="tw-h-full">{children}</div>
        </div>
      </div>
    </div>
  );
}
