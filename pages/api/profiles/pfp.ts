import { NextApiRequest, NextApiResponse } from "next";
import sharp from "sharp";
import axios from "axios";
import { createCanvas, loadImage } from "canvas";

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const { image, handle, level, tdh, rep, cic, cards } = req.query;

  const response = await axios({
    url: image as string,
    responseType: "arraybuffer",
  });

  try {
    const baseImageSharp = sharp(response.data);
    const baseImageBuffer = await baseImageSharp.toFormat("png").toBuffer();
    const baseImageMeta = await baseImageSharp.metadata();

    const textCanvas = await createTextOverlay(
      baseImageBuffer,
      handle,
      level,
      cards,
      tdh,
      rep,
      cic,
      baseImageMeta.width!,
      baseImageMeta.height!
    );

    const finalImage = Buffer.from(
      textCanvas.toDataURL().split(",")[1],
      "base64"
    );

    res.setHeader("Content-Type", "image/png");
    res.send(finalImage);
  } catch (error) {
    console.log(error);
    res.setHeader("Content-Type", response.headers["content-type"]);
    res.send(response.data);
  }
};

async function createTextOverlay(
  buffer: Buffer,
  handle: any,
  level: any,
  cards: any,
  tdh: any,
  rep: any,
  cic: any,
  width: number,
  height: number
) {
  const addedWidth = 300;
  const canvas = createCanvas(width + addedWidth, height);

  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  //image
  const image = await loadImage(buffer);
  ctx.drawImage(image, 0, 0, width, height);

  const textCenterX = width + 20;

  ctx.fillStyle = "white";

  //handle
  ctx.font = "30px Arial";
  ctx.fillText(handle, textCenterX, 50);

  //link
  const link = `seize.io/${handle.trim()}`;
  ctx.fillStyle = "#9a9a9a";
  ctx.font = "20px Arial";
  const linkWidth = ctx.measureText(link).width;
  ctx.fillText(link, textCenterX, 90);
  ctx.fillRect(textCenterX, 94, linkWidth, 2);

  //level
  ctx.fillStyle = "white";
  ctx.font = "30px Arial";
  ctx.fillText(`Level ${level}`, textCenterX, 140);

  let currentY = 220;
  const yOffset = 32;
  ctx.fillStyle = "white";
  ctx.font = "22px Arial";

  if (cards) {
    ctx.fillText(`Cards`, textCenterX, currentY);
    ctx.fillText(cards, textCenterX + 100, currentY);
    currentY += yOffset;
  }

  if (tdh) {
    ctx.fillText(`TDH`, textCenterX, currentY);
    ctx.fillText(tdh, textCenterX + 100, currentY);
    currentY += yOffset;
  }

  if (rep) {
    ctx.fillText(`REP`, textCenterX, currentY);
    ctx.fillText(rep, textCenterX + 100, currentY);
    currentY += yOffset;
  }

  if (cic) {
    ctx.fillText(`CIC`, textCenterX, currentY);
    ctx.fillText(cic, textCenterX + 100, currentY);
  }

  //trademark
  const trademark = "6529 Seize";
  ctx.fillStyle = "#9a9a9a";
  ctx.fillText(trademark, textCenterX, height - 22);

  const logo = await loadImage("public/Seize_Logo_2.png");
  ctx.drawImage(logo, width + addedWidth - 45, height - 45, 30, 30);

  return canvas;
}
