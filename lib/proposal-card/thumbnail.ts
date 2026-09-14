import {
  getProposalCardLogoSvg,
  PROPOSAL_CARD_LABELS,
  type ProposalCardLayout,
} from "./document";
import { normalizeDecentralizedMediaUrl } from "@/lib/media/decentralized-media";

const loadImage = async (url: string): Promise<HTMLImageElement> => {
  const image = new Image();
  image.crossOrigin = "anonymous";
  image.referrerPolicy = "no-referrer";
  image.src = normalizeDecentralizedMediaUrl(url) ?? url;
  await image.decode();
  return image;
};

/** A still of the frame for galleries that cannot display the HTML animation. */
export async function createProposalCardThumbnail(
  imageUrl: string,
  layout: ProposalCardLayout
): Promise<File> {
  const [image, logo] = await Promise.all([
    loadImage(imageUrl),
    loadImage(
      `data:image/svg+xml,${encodeURIComponent(getProposalCardLogoSvg())}`
    ),
  ]);
  const canvas = document.createElement("canvas");
  const portrait = layout === "portrait";
  canvas.width = portrait ? 1000 : 1400;
  canvas.height = portrait ? 1400 : 1000;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Unable to create the proposal frame preview.");
  const { width, height } = canvas;
  const edge = 30;
  context.fillStyle = "#fff";
  context.fillRect(0, 0, width, height);
  context.fillStyle = "#111";
  context.fillRect(edge, edge, width - edge * 2, height - edge * 2);
  const scale = Math.min(
    (width - edge * 2) / image.naturalWidth,
    (height - edge * 2) / image.naturalHeight
  );
  const imageWidth = image.naturalWidth * scale;
  const imageHeight = image.naturalHeight * scale;
  context.drawImage(
    image,
    (width - imageWidth) / 2,
    (height - imageHeight) / 2,
    imageWidth,
    imageHeight
  );
  context.font = "600 16px monospace";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(
    PROPOSAL_CARD_LABELS.top,
    width / 2,
    edge / 2,
    width - edge * 3
  );
  context.fillText(
    PROPOSAL_CARD_LABELS.bottom,
    width / 2,
    height - edge / 2,
    width - edge * 3
  );
  for (const side of ["left", "right"] as const) {
    context.save();
    context.translate(
      side === "left" ? edge / 2 : width - edge / 2,
      height / 2
    );
    context.rotate(side === "left" ? -Math.PI / 2 : Math.PI / 2);
    context.fillText(PROPOSAL_CARD_LABELS[side], 0, 0, height - edge * 3);
    context.restore();
  }
  for (const x of [0, width - edge]) {
    for (const y of [0, height - edge])
      context.drawImage(logo, x + 3, y + 3, edge - 6, edge - 6);
  }
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) =>
        result
          ? resolve(result)
          : reject(new Error("Unable to create the proposal frame preview.")),
      "image/png"
    );
  });
  return new File([blob], "proposal-card-preview.png", { type: "image/png" });
}
