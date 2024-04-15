import { useEffect, useState } from "react";
import { DropFull } from "../../../../entities/IDrop";
import DropAuthor from "./DropAuthor";
import DropPfp from "./DropPfp";
import Tippy from "@tippyjs/react";
import { useRouter } from "next/router";
import OutsideLinkIcon from "../../../utils/icons/OutsideLinkIcon";

export default function DropWrapper({
  drop,
  children,
}: {
  readonly drop: DropFull;
  readonly children: React.ReactNode;
}) {
  const router = useRouter();
  const [isTouchScreen, setIsTouchScreen] = useState(false);
  useEffect(() => {
    setIsTouchScreen(window.matchMedia("(pointer: coarse)").matches);
  }, [router.isReady]);

  return (
    <div className="tw-flex tw-gap-x-3">
      <div className="tw-hidden sm:tw-block">
        <DropPfp pfpUrl={drop.author.pfp} />
      </div>
      <div className="tw-flex tw-flex-col tw-w-full">
        <div className="tw-flex tw-gap-x-3">
          <div className="sm:tw-hidden">
            <DropPfp pfpUrl={drop.author.pfp} />
          </div>
          <div className="tw-w-full tw-inline-flex tw-justify-between">
            <DropAuthor
              handle={drop.author.handle}
              timestamp={drop.created_at}
            />
            <div className="tw-inline-flex">
              <Tippy
                content="Open"
                theme="dark"
                placement="top"
                disabled={isTouchScreen}
              >
                <a
                  href={`/brain/${drop.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`tw-block tw-p-2 tw-bg-transparent tw-cursor-pointer tw-text-sm sm:tw-text-base tw-font-semibold tw-text-iron-600 tw-border-0 focus:tw-outline-none tw-transition tw-duration-300 tw-ease-out`}
                >
                  <OutsideLinkIcon />
                </a>
              </Tippy>
            </div>
          </div>
        </div>
        <div className="tw-mt-1.5 lg:tw-mt-1">
          {drop.title && (
            <p className="tw-font-semibold tw-text-indigo-400 tw-text-md tw-mb-1">
              {drop.title}
            </p>
          )}
          <div className="tw-w-full">{children}</div>
        </div>
      </div>
    </div>
  );
}
