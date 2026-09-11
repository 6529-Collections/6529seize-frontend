import type { ApiOgMediaAsset } from "@/generated/models/ApiOgMediaAsset";
import type { ApiOgMetadataDrop } from "@/generated/models/ApiOgMetadataDrop";
import type { ApiOgMetadataProfile } from "@/generated/models/ApiOgMetadataProfile";
import type { ApiOgMetadataWave } from "@/generated/models/ApiOgMetadataWave";
import {
  formatInteger,
  getUsableText,
  truncateText,
} from "@/app/api/og-metadata/_lib/imageUtils";
import {
  ProfileAvatar,
  ProfileBadgeRow,
} from "@/app/api/og-metadata/_lib/profileSummary";
import {
  ADDITIONAL_ACTION_PROMISE_BACKGROUND,
  ADDITIONAL_ACTION_PROMISE_BORDER,
  ADDITIONAL_ACTION_PROMISE_CONTEXT_FONT_SIZE,
  ADDITIONAL_ACTION_PROMISE_CONTEXT_GAP,
  ADDITIONAL_ACTION_PROMISE_LABEL,
  ADDITIONAL_ACTION_PROMISE_TEXT,
  ADDITIONAL_ACTION_PROMISE_TITLE_BADGE_HEIGHT,
  ADDITIONAL_ACTION_PROMISE_TITLE_BADGE_WIDTH,
  ADDITIONAL_ACTION_PROMISE_TITLE_FONT_SIZE,
  AUTHOR_AVATAR_INNER_SIZE,
  AUTHOR_AVATAR_SIZE,
  AUTHOR_BADGE_SIZE,
  AUTHOR_ROW_TOP,
  CONTENT_WIDTH,
  FILE_ICON_BACKGROUND,
  FILE_ICON_BORDER,
  FILE_ICON_TEXT,
  HORIZONTAL_MARGIN,
  LOGO_SIZE,
  MUTED_TEXT,
  SUBMISSION_DATE_FORMATTER,
  SUBMISSION_MEDIA_HEIGHT,
  SUBMISSION_TITLE_GAP,
  SUBMISSION_TITLE_ICON_SIZE,
  SUBMISSION_TROPHY_ICON_SIZE,
  TROPHY_COLOR,
  VIDEO_ICON_BACKGROUND,
  VIDEO_ICON_BORDER,
  VIDEO_ICON_TEXT,
} from "./constants";
import { getImageMediaAssets, getSubmissionMediaStyles } from "./attachments";
import { truncateToWidth } from "./textMetrics";
import type {
  SubmissionPreviewMedia,
  SubmissionPreviewMediaCategory,
} from "./types";

const getDropContext = ({
  wave,
}: {
  readonly wave: ApiOgMetadataWave | undefined;
}): string | null => getUsableText(wave?.name);

const VideoContentIcon = () => (
  <div
    style={{
      alignItems: "center",
      background: VIDEO_ICON_BACKGROUND,
      border: `1px solid ${VIDEO_ICON_BORDER}`,
      borderRadius: 6,
      color: VIDEO_ICON_TEXT,
      display: "flex",
      height: 38,
      justifyContent: "center",
      marginRight: 12,
      width: 38,
    }}
  >
    <svg fill="currentColor" height={18} viewBox="0 0 576 512" width={22}>
      <path d="M0 128C0 92.7 28.7 64 64 64l256 0c35.3 0 64 28.7 64 64l0 256c0 35.3-28.7 64-64 64L64 448c-35.3 0-64-28.7-64-64L0 128zM559.1 99.8c10.4 5.6 16.9 16.4 16.9 28.2l0 256c0 11.8-6.5 22.6-16.9 28.2s-23 5-32.9-1.6l-96-64L416 336l0-48 0-64 0-48 14.2-9.5 96-64c9.8-6.5 22.4-7.2 32.9-1.6z" />
    </svg>
  </div>
);

const FileContentIcon = () => (
  <div
    style={{
      alignItems: "center",
      background: FILE_ICON_BACKGROUND,
      border: `1px solid ${FILE_ICON_BORDER}`,
      borderRadius: 6,
      color: FILE_ICON_TEXT,
      display: "flex",
      height: 38,
      justifyContent: "center",
      marginRight: 12,
      width: 38,
    }}
  >
    <svg fill="currentColor" height={21} viewBox="0 0 384 512" width={16}>
      <path d="M64 0C28.7 0 0 28.7 0 64v384c0 35.3 28.7 64 64 64h256c35.3 0 64-28.7 64-64V160L224 0H64zm192 176c-17.7 0-32-14.3-32-32V48l112 112h-80zM96 280c0-13.3 10.7-24 24-24h144c13.3 0 24 10.7 24 24s-10.7 24-24 24H120c-13.3 0-24-10.7-24-24zm0 80c0-13.3 10.7-24 24-24h144c13.3 0 24 10.7 24 24s-10.7 24-24 24H120c-13.3 0-24-10.7-24-24zm0 80c0-13.3 10.7-24 24-24h96c13.3 0 24 10.7 24 24s-10.7 24-24 24h-96c-13.3 0-24-10.7-24-24z" />
    </svg>
  </div>
);

const SUBMISSION_ICON_BY_CATEGORY: Record<
  SubmissionPreviewMediaCategory,
  { readonly path: string; readonly viewBox: string }
> = {
  image: {
    viewBox: "0 0 512 512",
    path: "M0 96C0 60.7 28.7 32 64 32l384 0c35.3 0 64 28.7 64 64l0 320c0 35.3-28.7 64-64 64L64 480c-35.3 0-64-28.7-64-64L0 96zM323.8 202.5c-4.5-6.6-11.9-10.5-19.8-10.5s-15.4 3.9-19.8 10.5l-87 127.6L170.7 297c-4.6-5.7-11.5-9-18.7-9s-14.2 3.3-18.7 9l-64 80c-5.8 7.2-6.9 17.1-2.9 25.4s12.4 13.6 21.6 13.6l96 0 32 0 208 0c8.9 0 17.1-4.9 21.2-12.8s3.6-17.4-1.4-24.7l-120-176zM112 192a48 48 0 1 0 0-96 48 48 0 1 0 0 96z",
  },
  interactive: {
    viewBox: "20 10 230 240",
    path: "M195.4,107.9c-2.6,0-5,0.4-7.4,1.2c-0.2-0.1-0.5-0.2-0.8-0.3c-4.4-7.1-12-11.4-20.4-11.4c-2.9,0-5.7,0.5-8.4,1.4c-4.4-7.4-12.1-11.9-20.8-11.9c-1.6,0-3.1,0.1-4.6,0.4V73.9c0-14-10.7-24.9-24.4-24.9c-13.8,0-25,11.2-25,24.9v65.8l-3.9-3.9c-4.5-4.4-10.7-6.9-17.5-6.9c-6.9,0-13.6,2.6-17.9,6.9c-9.4,9.4-12.5,25.7-1.5,36.7l56.2,55.9c1.3,1.3,2.8,2.4,4.4,3.4c10.5,8.6,23.1,14.2,49.7,14.2c61.8,0,66.9-36.2,66.9-73.3v-40C220.1,118.8,209.4,107.9,195.4,107.9L195.4,107.9z M210.3,172.8c0,36-4.2,63.5-57.1,63.5c-24,0-34.5-4.7-43.7-12.2l-0.6-0.4c-1.1-0.7-2-1.4-2.9-2.2l-56.2-55.8c-7.3-7.3-3.5-17.8,1.5-22.8c2.5-2.5,6.7-4,10.9-4c4.2,0,8,1.4,10.6,4l20.6,20.5V73.8c0-8.3,6.8-15.1,15.2-15.1c8.2,0,14.6,6.6,14.6,15.1v28.5l0.1-0.1v29.3c0,2.7,2.2,4.9,4.9,4.9c2.7,0,4.9-2.2,4.9-4.9V97.4c1.4-0.4,2.9-0.7,4.5-0.7c6.3,0,11.6,3.9,13.8,10.2l0.6,1.8v32.1c0,2.7,2.2,4.9,4.9,4.9c2.7,0,4.9-2.2,4.9-4.9V108c1.6-0.5,3.3-0.9,4.9-0.9c6.3,0,11.6,3.9,13.8,10.2l0.3,1v32.1c0,2.7,2.2,4.9,4.9,4.9c2.7,0,4.9-2.2,4.9-4.9v-31.8c1.6-0.6,3.2-1,5.2-1c8.2,0,14.4,6.5,14.4,15.1V172.8L210.3,172.8z M68.4,120.1c0.9,0.7,1.9,1,2.9,1c1.5,0,3-0.7,4-2c1.6-2.2,1.2-5.3-1-6.9C61.1,102.4,53.5,87.4,53.5,71c0-28.3,23-51.2,51.2-51.2S156,42.8,156,71c0,3.4-0.3,6.9-1,10.2c-0.5,2.6,1.2,5.3,3.9,5.8c2.6,0.5,5.3-1.2,5.8-3.9c0.8-4,1.2-8.1,1.2-12.1c0-33.6-27.4-61-61-61S43.7,37.4,43.7,71.1C43.7,90.3,52.9,108.6,68.4,120.1L68.4,120.1z",
  },
  unknown: {
    viewBox: "0 0 384 512",
    path: "M64 0C28.7 0 0 28.7 0 64v384c0 35.3 28.7 64 64 64h256c35.3 0 64-28.7 64-64V160L224 0H64zm192 176c-17.7 0-32-14.3-32-32V48l112 112h-80z",
  },
  video: {
    viewBox: "0 0 576 512",
    path: "M0 128C0 92.7 28.7 64 64 64l256 0c35.3 0 64 28.7 64 64l0 256c0 35.3-28.7 64-64 64L64 448c-35.3 0-64-28.7-64-64L0 128zM559.1 99.8c10.4 5.6 16.9 16.4 16.9 28.2l0 256c0 11.8-6.5 22.6-16.9 28.2s-23 5-32.9-1.6l-96-64L416 336l0-48 0-64 0-48 14.2-9.5 96-64c9.8-6.5 22.4-7.2 32.9-1.6z",
  },
};

const TrophyIcon = ({
  size = SUBMISSION_TROPHY_ICON_SIZE,
}: {
  readonly size?: number;
}) => (
  <svg
    fill={TROPHY_COLOR}
    height={size}
    style={{
      display: "flex",
      height: size,
      marginTop: -1,
      width: size,
    }}
    viewBox="0 0 576 512"
    width={size}
  >
    <path d="M400 0L176 0c-26.5 0-48.1 21.8-47.1 48.2c.2 5.3 .4 10.6 .7 15.8L24 64C10.7 64 0 74.7 0 88c0 92.6 33.5 157 78.5 200.7c34.2 33.1 73.7 52.3 105.2 63.4c22.4 26 47 41.8 68.3 49.2L252 464l-64 0c-17.7 0-32 14.3-32 32s14.3 32 32 32l160 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-64 0l0-62.7c21.3-7.4 45.9-23.2 68.3-49.2c31.5-11.1 70-30.3 105.2-63.4C522.5 245 576 180.6 576 88c0-13.3-10.7-24-24-24l-105.6 0c.3-5.2 .5-10.4 .7-15.8C448.1 21.8 426.5 0 400 0zM48.9 112l84.4 0c8.1 90.1 29.2 150.3 55.1 190.6c-24.9-10.1-52.3-25.4-76.5-48.8C78.4 221.3 54.1 174.9 48.9 112zM464.1 253.8c-24.2 23.4-51.6 38.7-76.5 48.8c25.9-40.3 47-100.5 55.1-190.6l84.4 0c-5.2 62.9-29.5 109.3-63 141.8z" />
  </svg>
);

const SubmissionMediaIcon = ({
  media,
  size = SUBMISSION_TITLE_ICON_SIZE,
}: {
  readonly media: SubmissionPreviewMedia;
  readonly size?: number;
}) => {
  const icon = SUBMISSION_ICON_BY_CATEGORY[media.category];
  const iconSize = Math.round(
    size * (media.category === "interactive" ? 0.5 : 0.55)
  );
  const iconHeight =
    media.category === "video" ? Math.round((iconSize * 512) / 576) : iconSize;
  const styles = getSubmissionMediaStyles(media);

  return (
    <div
      style={{
        alignItems: "center",
        background: styles.bg,
        border: `1px solid ${styles.border}`,
        borderRadius: 8,
        color: styles.text,
        display: "flex",
        height: size,
        justifyContent: "center",
        width: size,
      }}
    >
      <svg
        fill="currentColor"
        height={iconHeight}
        viewBox={icon.viewBox}
        width={iconSize}
      >
        <path d={icon.path} />
      </svg>
    </div>
  );
};

const DropAuthorRow = ({
  author,
  authorAvatarUrl,
  authorName,
  showAdditionalActionText = false,
  wave,
}: {
  readonly author: ApiOgMetadataProfile | undefined;
  readonly authorAvatarUrl: string | null;
  readonly authorName: string;
  readonly showAdditionalActionText?: boolean;
  readonly wave: ApiOgMetadataWave | undefined;
}) => {
  const context = getDropContext({ wave });
  const contextRowWidth =
    CONTENT_WIDTH - LOGO_SIZE - 42 - AUTHOR_AVATAR_SIZE - 16;
  const promiseTextGap =
    showAdditionalActionText && context
      ? ADDITIONAL_ACTION_PROMISE_CONTEXT_GAP
      : 0;
  const promiseTextWidth = showAdditionalActionText
    ? ADDITIONAL_ACTION_PROMISE_TITLE_BADGE_WIDTH + promiseTextGap
    : 0;
  const contextText = context
    ? truncateToWidth({
        fontSize: ADDITIONAL_ACTION_PROMISE_CONTEXT_FONT_SIZE,
        value: context,
        width: Math.max(0, contextRowWidth - promiseTextWidth),
      })
    : null;

  return (
    <div
      style={{
        alignItems: "center",
        display: "flex",
        gap: 16,
        left: HORIZONTAL_MARGIN,
        position: "absolute",
        top: AUTHOR_ROW_TOP,
        width: CONTENT_WIDTH - LOGO_SIZE - 42,
      }}
    >
      <ProfileAvatar
        avatarUrl={authorAvatarUrl}
        borderRadius={14}
        innerBorderRadius={11}
        innerSize={AUTHOR_AVATAR_INNER_SIZE}
        size={AUTHOR_AVATAR_SIZE}
      />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 3,
        }}
      >
        <div
          style={{
            alignItems: "center",
            display: "flex",
            gap: 10,
          }}
        >
          <div
            style={{
              color: "#ffffff",
              display: "flex",
              fontSize: 34,
              fontWeight: 700,
              lineHeight: 1.15,
              maxWidth: 320,
              overflow: "hidden",
            }}
          >
            {truncateText(authorName, 18)}
          </div>
          <ProfileBadgeRow
            activityBorderRadius={10}
            activityIconSize={18}
            badgeSize={AUTHOR_BADGE_SIZE}
            cicFontSize={24}
            glassesSize={29}
            levelFontSize={15}
            profile={author}
          />
        </div>
        <div
          style={{
            alignItems: "center",
            display: "flex",
            fontSize: ADDITIONAL_ACTION_PROMISE_CONTEXT_FONT_SIZE,
            fontWeight: 500,
            gap: ADDITIONAL_ACTION_PROMISE_CONTEXT_GAP,
            lineHeight: 1.25,
            maxWidth: contextRowWidth,
            overflow: "hidden",
            whiteSpace: "nowrap",
          }}
        >
          {contextText ? (
            <span
              style={{
                color: MUTED_TEXT,
                display: "flex",
                overflow: "hidden",
                whiteSpace: "nowrap",
              }}
            >
              {contextText}
            </span>
          ) : null}
          {showAdditionalActionText ? <AdditionalActionPromiseBadge /> : null}
        </div>
      </div>
    </div>
  );
};

const getSubmissionTitle = (
  drop: ApiOgMetadataDrop | undefined,
  id: string
): string =>
  getUsableText(drop?.title) ??
  getUsableText(drop?.content) ??
  getUsableText(drop?.description) ??
  `Drop #${drop?.serial_no ?? id}`;

const getSubmissionTitleWidth = (): number =>
  CONTENT_WIDTH - SUBMISSION_TITLE_ICON_SIZE - SUBMISSION_TITLE_GAP;

const getSubmissionVisualImage = (
  media: readonly ApiOgMediaAsset[] | null | undefined
): ApiOgMediaAsset | undefined => getImageMediaAssets(media)[0];

const getSubmissionVotes = (
  drop: ApiOgMetadataDrop | undefined
): {
  readonly tdh: string;
  readonly voters: number;
} => ({
  tdh: formatInteger(drop?.votes?.current_calculated_vote) ?? "0",
  voters:
    typeof drop?.votes?.voters_count === "number" &&
    Number.isFinite(drop.votes.voters_count)
      ? drop.votes.voters_count
      : 0,
});

const formatSubmissionDate = (
  timestamp: number | null | undefined
): string | null => {
  if (typeof timestamp !== "number" || !Number.isFinite(timestamp)) {
    return null;
  }

  return SUBMISSION_DATE_FORMATTER.format(new Date(timestamp));
};

const getSubmissionStatDate = ({
  submittedAt,
  wonAt,
}: {
  readonly submittedAt: string | null;
  readonly wonAt: string | null;
}): { readonly label: string; readonly value: string } | null => {
  if (wonAt) {
    return { label: "Winner", value: wonAt };
  }

  if (submittedAt) {
    return { label: "Submitted", value: submittedAt };
  }

  return null;
};

const SubmissionMediaPlaceholder = ({
  media,
}: {
  readonly media: SubmissionPreviewMedia;
}) => (
  <div
    style={{
      alignItems: "center",
      borderRadius: 28,
      display: "flex",
      flexDirection: "column",
      gap: 16,
      height: SUBMISSION_MEDIA_HEIGHT,
      justifyContent: "center",
      width: CONTENT_WIDTH,
    }}
  >
    <SubmissionMediaIcon media={media} size={78} />
    <div
      style={{
        color: MUTED_TEXT,
        display: "flex",
        fontSize: 28,
        fontWeight: 600,
        maxWidth: CONTENT_WIDTH - 160,
        overflow: "hidden",
        textAlign: "center",
        whiteSpace: "nowrap",
      }}
    >
      {truncateText(media.label, 42)}
    </div>
  </div>
);

function AdditionalActionPromiseBadge() {
  return (
    <div
      style={{
        alignItems: "center",
        alignSelf: "center",
        background: ADDITIONAL_ACTION_PROMISE_BACKGROUND,
        border: `1px solid ${ADDITIONAL_ACTION_PROMISE_BORDER}`,
        borderRadius: 999,
        color: ADDITIONAL_ACTION_PROMISE_TEXT,
        display: "flex",
        flexShrink: 0,
        fontSize: ADDITIONAL_ACTION_PROMISE_TITLE_FONT_SIZE,
        fontWeight: 600,
        height: ADDITIONAL_ACTION_PROMISE_TITLE_BADGE_HEIGHT,
        justifyContent: "center",
        lineHeight: 1,
        padding: "0 12px",
        whiteSpace: "nowrap",
        width: ADDITIONAL_ACTION_PROMISE_TITLE_BADGE_WIDTH,
      }}
    >
      {ADDITIONAL_ACTION_PROMISE_LABEL}
    </div>
  );
}

export {
  DropAuthorRow,
  FileContentIcon,
  SubmissionMediaIcon,
  SubmissionMediaPlaceholder,
  TrophyIcon,
  VideoContentIcon,
  formatSubmissionDate,
  getSubmissionStatDate,
  getSubmissionTitle,
  getSubmissionTitleWidth,
  getSubmissionVisualImage,
  getSubmissionVotes,
};
