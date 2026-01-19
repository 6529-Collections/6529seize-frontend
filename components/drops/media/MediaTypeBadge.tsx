"use client";

import { getMediaTypeInfo, type MediaCategory } from "@/helpers/file.helpers";
import { useControlledTooltip } from "@/hooks/useControlledTooltip";
import { Tooltip } from "react-tooltip";

const FORMAT_ICONS: Record<MediaCategory, { viewBox: string; path: string }> = {
  image: {
    viewBox: "0 0 512 512",
    path: "M0 96C0 60.7 28.7 32 64 32l384 0c35.3 0 64 28.7 64 64l0 320c0 35.3-28.7 64-64 64L64 480c-35.3 0-64-28.7-64-64L0 96zM323.8 202.5c-4.5-6.6-11.9-10.5-19.8-10.5s-15.4 3.9-19.8 10.5l-87 127.6L170.7 297c-4.6-5.7-11.5-9-18.7-9s-14.2 3.3-18.7 9l-64 80c-5.8 7.2-6.9 17.1-2.9 25.4s12.4 13.6 21.6 13.6l96 0 32 0 208 0c8.9 0 17.1-4.9 21.2-12.8s3.6-17.4-1.4-24.7l-120-176zM112 192a48 48 0 1 0 0-96 48 48 0 1 0 0 96z",
  },
  video: {
    viewBox: "0 0 576 512",
    path: "M0 128C0 92.7 28.7 64 64 64l256 0c35.3 0 64 28.7 64 64l0 256c0 35.3-28.7 64-64 64L64 448c-35.3 0-64-28.7-64-64L0 128zM559.1 99.8c10.4 5.6 16.9 16.4 16.9 28.2l0 256c0 11.8-6.5 22.6-16.9 28.2s-23 5-32.9-1.6l-96-64L416 336l0-48 0-64 0-48 14.2-9.5 96-64c9.8-6.5 22.4-7.2 32.9-1.6z",
  },
  interactive: {
    viewBox: "45 15 170 230",
    path: "M195.4,107.9c-2.6,0-5,0.4-7.4,1.2c-0.2-0.1-0.5-0.2-0.8-0.3c-4.4-7.1-12-11.4-20.4-11.4c-2.9,0-5.7,0.5-8.4,1.4c-4.4-7.4-12.1-11.9-20.8-11.9c-1.6,0-3.1,0.1-4.6,0.4V73.9c0-14-10.7-24.9-24.4-24.9c-13.8,0-25,11.2-25,24.9v65.8l-3.9-3.9c-4.5-4.4-10.7-6.9-17.5-6.9c-6.9,0-13.6,2.6-17.9,6.9c-9.4,9.4-12.5,25.7-1.5,36.7l56.2,55.9c1.3,1.3,2.8,2.4,4.4,3.4c10.5,8.6,23.1,14.2,49.7,14.2c61.8,0,66.9-36.2,66.9-73.3v-40C220.1,118.8,209.4,107.9,195.4,107.9L195.4,107.9z M210.3,172.8c0,36-4.2,63.5-57.1,63.5c-24,0-34.5-4.7-43.7-12.2l-0.6-0.4c-1.1-0.7-2-1.4-2.9-2.2l-56.2-55.8c-7.3-7.3-3.5-17.8,1.5-22.8c2.5-2.5,6.7-4,10.9-4c4.2,0,8,1.4,10.6,4l20.6,20.5V73.8c0-8.3,6.8-15.1,15.2-15.1c8.2,0,14.6,6.6,14.6,15.1v28.5l0.1-0.1v29.3c0,2.7,2.2,4.9,4.9,4.9c2.7,0,4.9-2.2,4.9-4.9V97.4c1.4-0.4,2.9-0.7,4.5-0.7c6.3,0,11.6,3.9,13.8,10.2l0.6,1.8v32.1c0,2.7,2.2,4.9,4.9,4.9c2.7,0,4.9-2.2,4.9-4.9V108c1.6-0.5,3.3-0.9,4.9-0.9c6.3,0,11.6,3.9,13.8,10.2l0.3,1v32.1c0,2.7,2.2,4.9,4.9,4.9c2.7,0,4.9-2.2,4.9-4.9v-31.8c1.6-0.6,3.2-1,5.2-1c8.2,0,14.4,6.5,14.4,15.1V172.8L210.3,172.8z M68.4,120.1c0.9,0.7,1.9,1,2.9,1c1.5,0,3-0.7,4-2c1.6-2.2,1.2-5.3-1-6.9C61.1,102.4,53.5,87.4,53.5,71c0-28.3,23-51.2,51.2-51.2S156,42.8,156,71c0,3.4-0.3,6.9-1,10.2c-0.5,2.6,1.2,5.3,3.9,5.8c2.6,0.5,5.3-1.2,5.8-3.9c0.8-4,1.2-8.1,1.2-12.1c0-33.6-27.4-61-61-61S43.7,37.4,43.7,71.1C43.7,90.3,52.9,108.6,68.4,120.1L68.4,120.1z",
  },
};

interface MediaTypeBadgeProps {
  readonly mimeType: string | undefined;
  readonly dropId: string;
  readonly size?: "sm" | "md" | "lg";
}

const SIZE_CLASSES = {
  sm: "tw-size-6",
  md: "tw-size-8",
  lg: "tw-size-10",
};

const ICON_SIZE_CLASSES = {
  sm: "tw-size-3",
  md: "tw-size-4",
  lg: "tw-size-5",
};

export default function MediaTypeBadge({
  mimeType,
  dropId,
  size = "sm",
}: MediaTypeBadgeProps) {
  const mediaInfo = getMediaTypeInfo(mimeType);
  const tooltipId = `format-badge-${dropId}`;
  const { isOpen, setIsOpen, triggerProps } = useControlledTooltip();

  return (
    <div className="tw-flex tw-flex-shrink-0">
      <div
        data-tooltip-id={tooltipId}
        data-tooltip-content={mediaInfo.label}
        aria-label={mediaInfo.label}
        {...triggerProps}
        className={`tw-flex tw-cursor-pointer tw-items-center tw-justify-center tw-rounded tw-border tw-border-solid ${SIZE_CLASSES[size]}`}
        style={{
          color: mediaInfo.styles.text,
          backgroundColor: mediaInfo.styles.bg,
          borderColor: mediaInfo.styles.border,
        }}
      >
        <svg
          className={ICON_SIZE_CLASSES[size]}
          fill="currentColor"
          viewBox={FORMAT_ICONS[mediaInfo.category].viewBox}
        >
          <path d={FORMAT_ICONS[mediaInfo.category].path} />
        </svg>
      </div>
      <Tooltip
        id={tooltipId}
        place="top"
        opacity={1}
        delayShow={300}
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        style={{
          padding: "4px 8px",
          background: "#37373E",
          color: "white",
          fontSize: "12px",
          borderRadius: "6px",
          zIndex: 9999,
        }}
      />
    </div>
  );
}
