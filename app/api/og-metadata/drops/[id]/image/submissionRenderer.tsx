import type { ApiOgMetadataDrop } from "@/generated/models/ApiOgMetadataDrop";
import type { ApiOgMetadataProfile } from "@/generated/models/ApiOgMetadataProfile";
import type { ApiOgMetadataWave } from "@/generated/models/ApiOgMetadataWave";
import {
  formatInteger,
  getMediaProxyUrl,
  getUsableText,
  pluralize,
} from "@/app/api/og-metadata/_lib/imageUtils";
import {
  CARD_BACKGROUND,
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  CONTENT_BACKGROUND,
  CONTENT_WIDTH,
  HORIZONTAL_MARGIN,
  LOGO_SIZE,
  LOGO_URL,
  MUTED_TEXT,
  SUBMISSION_MEDIA_CONTENT_HEIGHT,
  SUBMISSION_MEDIA_HEIGHT,
  SUBMISSION_MEDIA_TOP,
  SUBMISSION_STATS_FONT_SIZE,
  SUBMISSION_STATS_GROUP_GAP,
  SUBMISSION_STATS_TOP,
  SUBMISSION_STATS_TROPHY_ICON_SIZE,
  SUBMISSION_STATS_VALUE_GAP,
  SUBMISSION_TITLE_FONT_SIZE,
  SUBMISSION_TITLE_GAP,
  SUBMISSION_TITLE_TOP,
} from "./constants";
import { getSubmissionPreviewMedia } from "./attachments";
import {
  DropAuthorRow,
  SubmissionMediaIcon,
  SubmissionMediaPlaceholder,
  TrophyIcon,
  formatSubmissionDate,
  getSubmissionStatDate,
  getSubmissionTitle,
  getSubmissionTitleWidth,
  getSubmissionVisualImage,
  getSubmissionVotes,
} from "./components";
import { truncateToWidth } from "./textMetrics";

const renderSubmissionDropOgImage = ({
  author,
  authorAvatarUrl,
  authorName,
  drop,
  id,
  origin,
  wave,
}: {
  readonly author: ApiOgMetadataProfile | undefined;
  readonly authorAvatarUrl: string | null;
  readonly authorName: string;
  readonly drop: ApiOgMetadataDrop | undefined;
  readonly id: string;
  readonly origin: string;
  readonly wave: ApiOgMetadataWave | undefined;
}) => {
  const submissionMedia = getSubmissionPreviewMedia(drop?.media);
  const visualImage = getSubmissionVisualImage(drop?.media);
  const visualImageUrl = getMediaProxyUrl({
    sourceUrl: getUsableText(visualImage?.url),
    origin,
    width: CONTENT_WIDTH,
  });
  const rawTitle = getSubmissionTitle(drop, id);
  const votes = getSubmissionVotes(drop);
  const submittedAt = formatSubmissionDate(drop?.submitted_at);
  const wonAt = formatSubmissionDate(drop?.won_at);
  const statDate = getSubmissionStatDate({ submittedAt, wonAt });
  const isAdditionalActionPromised =
    drop?.is_additional_action_promised === true;
  const title = truncateToWidth({
    fontSize: SUBMISSION_TITLE_FONT_SIZE,
    value: rawTitle,
    width: getSubmissionTitleWidth(),
  });

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
          height: SUBMISSION_MEDIA_HEIGHT,
          left: 0,
          position: "absolute",
          top: SUBMISSION_MEDIA_TOP,
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
        showAdditionalActionText={isAdditionalActionPromised}
        wave={wave}
      />

      <div
        style={{
          alignItems: "center",
          display: "flex",
          gap: SUBMISSION_TITLE_GAP,
          justifyContent: "flex-start",
          left: HORIZONTAL_MARGIN,
          position: "absolute",
          top: SUBMISSION_TITLE_TOP,
          width: CONTENT_WIDTH,
        }}
      >
        <SubmissionMediaIcon media={submissionMedia} />
        <div
          style={{
            color: "#ffffff",
            display: "flex",
            fontSize: SUBMISSION_TITLE_FONT_SIZE,
            fontWeight: 700,
            lineHeight: 1.15,
            maxWidth: getSubmissionTitleWidth(),
            overflow: "hidden",
            whiteSpace: "nowrap",
          }}
        >
          {title}
        </div>
      </div>

      <div
        style={{
          alignItems: "center",
          display: "flex",
          height: SUBMISSION_MEDIA_HEIGHT,
          justifyContent: "center",
          left: HORIZONTAL_MARGIN,
          overflow: "hidden",
          position: "absolute",
          top: SUBMISSION_MEDIA_TOP,
          width: CONTENT_WIDTH,
        }}
      >
        {visualImageUrl ? (
          <img
            alt=""
            height={SUBMISSION_MEDIA_CONTENT_HEIGHT}
            src={visualImageUrl}
            style={{
              height: SUBMISSION_MEDIA_CONTENT_HEIGHT,
              objectFit: "contain",
              objectPosition: "center center",
              width: CONTENT_WIDTH,
            }}
            width={CONTENT_WIDTH}
          />
        ) : (
          <SubmissionMediaPlaceholder media={submissionMedia} />
        )}
      </div>

      <div
        style={{
          alignItems: "center",
          display: "flex",
          fontSize: SUBMISSION_STATS_FONT_SIZE,
          fontWeight: 600,
          gap: SUBMISSION_STATS_GROUP_GAP,
          justifyContent: statDate ? "space-between" : "center",
          left: HORIZONTAL_MARGIN,
          position: "absolute",
          top: SUBMISSION_STATS_TOP,
          width: CONTENT_WIDTH,
        }}
      >
        <div
          style={{
            alignItems: "center",
            display: "flex",
            gap: SUBMISSION_STATS_GROUP_GAP,
          }}
        >
          <div
            style={{
              alignItems: "center",
              display: "flex",
              gap: SUBMISSION_STATS_VALUE_GAP,
            }}
          >
            <span style={{ color: "#ffffff" }}>{votes.tdh}</span>
            <span style={{ color: MUTED_TEXT }}>TDH</span>
          </div>
          <div
            style={{
              alignItems: "center",
              display: "flex",
              gap: SUBMISSION_STATS_VALUE_GAP,
            }}
          >
            <span style={{ color: "#ffffff" }}>
              {formatInteger(votes.voters) ?? "0"}
            </span>
            <span style={{ color: MUTED_TEXT }}>
              {pluralize(votes.voters, "Voter", "Voters")}
            </span>
          </div>
        </div>
        {statDate ? (
          <div
            style={{
              alignItems: "center",
              display: "flex",
              gap: SUBMISSION_STATS_VALUE_GAP,
            }}
          >
            {statDate.label === "Winner" ? (
              <TrophyIcon size={SUBMISSION_STATS_TROPHY_ICON_SIZE} />
            ) : null}
            <span style={{ color: MUTED_TEXT }}>{statDate.label}</span>
            <span style={{ color: "#ffffff" }}>{statDate.value}</span>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export { renderSubmissionDropOgImage };
