import React, { useState, useCallback } from "react";
import {
  getScaledImageUri,
  ImageScale,
} from "../../../../../../helpers/image.helpers";

/**
 * Image display component without interactive modal functionality.
 * Based on DropListItemContentMediaImage but without the modal functionality.
 */
function MediaDisplayImage({
  src,
}: {
  readonly src: string;
}) {
  const [isLoading, setIsLoading] = useState(true);

  const handleImageLoad = useCallback(() => {
    setIsLoading(false);
  }, []);

  const loadingPlaceholderStyle: React.CSSProperties = {
    width: "100%",
    height: "100%",
    maxWidth: "100%",
    maxHeight: "100%",
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
  };

  return (
    <div className="tw-w-full tw-h-full tw-flex tw-items-center tw-justify-center tw-relative tw-mx-[1px]">
      {isLoading && (
        <div
          className="tw-bg-iron-800 tw-animate-pulse tw-rounded-xl"
          style={loadingPlaceholderStyle}
        />
      )}
      <img
        src={getScaledImageUri(src, ImageScale.AUTOx450)}
        alt="Media content"
        className={`tw-object-contain tw-max-w-full ${
          isLoading ? "tw-opacity-0" : "tw-opacity-100"
        }`}
        style={{
          maxWidth: "100%",
          maxHeight: "100%",
        }}
        onLoad={handleImageLoad}
      />
    </div>
  );
}

export default React.memo(MediaDisplayImage);
