import { publicEnv } from "@/config/env";
import type { ApiOgMetadataDrop } from "@/generated/models/ApiOgMetadataDrop";
import type { ApiOgMetadataProfile } from "@/generated/models/ApiOgMetadataProfile";
import type { ApiOgMetadataWave } from "@/generated/models/ApiOgMetadataWave";
import {
  getFirstMediaUrl,
  getMediaProxyUrl,
} from "@/app/api/og-metadata/_lib/imageUtils";
import { getProfileDisplayName } from "@/app/api/og-metadata/_lib/profileSummary";
import {
  AUTHOR_AVATAR_INNER_SIZE,
  CARD_BACKGROUND,
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  CHAT_CONTENT_BACKGROUND_TOP,
  CONTENT_BACKGROUND,
  HORIZONTAL_MARGIN,
  LOGO_SIZE,
  LOGO_URL,
} from "./constants";
import {
  DropContentLines,
  DropMediaGallery,
  SingleDropMedia,
  getChatDropOgImageModel,
} from "./chatRenderer";
import { DropAuthorRow } from "./components";
import { renderSubmissionDropOgImage } from "./submissionRenderer";

export const renderDropOgImage = ({
  author,
  drop,
  id,
  origin = publicEnv.BASE_ENDPOINT,
  wave,
}: {
  readonly author: ApiOgMetadataProfile | undefined;
  readonly drop: ApiOgMetadataDrop | undefined;
  readonly id: string;
  readonly origin?: string;
  readonly wave: ApiOgMetadataWave | undefined;
}) => {
  const authorName = getProfileDisplayName(author);
  const authorAvatarUrl = getMediaProxyUrl({
    sourceUrl: getFirstMediaUrl(author?.media),
    origin,
    width: AUTHOR_AVATAR_INNER_SIZE,
  });

  if (drop?.drop_type === "SUBMISSION") {
    return renderSubmissionDropOgImage({
      author,
      authorAvatarUrl,
      authorName,
      drop,
      id,
      origin,
      wave,
    });
  }

  const model = getChatDropOgImageModel({ drop, id, origin });

  return (
    <div
      style={{
        background: CARD_BACKGROUND,
        color: "#ffffff",
        display: "flex",
        fontFamily: "Montserrat, sans-serif",
        height: CANVAS_HEIGHT,
        overflow: "hidden",
        position: "relative",
        width: CANVAS_WIDTH,
      }}
    >
      <div
        style={{
          background: CONTENT_BACKGROUND,
          display: "flex",
          height: CANVAS_HEIGHT - CHAT_CONTENT_BACKGROUND_TOP,
          left: 0,
          position: "absolute",
          top: CHAT_CONTENT_BACKGROUND_TOP,
          width: CANVAS_WIDTH,
        }}
      />
      <div
        style={{
          display: "flex",
          height: LOGO_SIZE,
          position: "absolute",
          right: HORIZONTAL_MARGIN,
          top: HORIZONTAL_MARGIN,
          width: LOGO_SIZE,
        }}
      >
        <img
          alt=""
          height={LOGO_SIZE}
          src={LOGO_URL}
          style={{
            height: LOGO_SIZE,
            objectFit: "contain",
            opacity: 0.75,
            width: LOGO_SIZE,
          }}
          width={LOGO_SIZE}
        />
      </div>

      <DropAuthorRow
        author={author}
        authorAvatarUrl={authorAvatarUrl}
        authorName={authorName}
        wave={wave}
      />

      <DropContentLines
        contentLines={model.contentLines}
        contentTop={model.contentTop}
        shouldCenterContent={model.shouldCenterContent}
      />
      <SingleDropMedia
        mediaPresentation={model.mediaPresentation}
        singleMediaUrl={model.singleMediaUrl}
      />
      <DropMediaGallery
        mediaPresentation={model.mediaPresentation}
        origin={origin}
      />
    </div>
  );
};
