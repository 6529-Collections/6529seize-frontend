import { NextApiRequest, NextApiResponse } from "next";
import sharp from "sharp";
import axios from "axios";
import { createCanvas, loadImage } from "canvas";

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const { image } = req.query;

  const response = await axios({
    url: image as string,
    responseType: "arraybuffer",
  });

  try {
    const baseImageSharp = sharp(response.data);
    const baseImageMeta = await baseImageSharp.metadata();
    const baseImageBuffer = await baseImageSharp.toFormat("png").toBuffer();
    const canvas = createCanvas(
      baseImageMeta.height! * 2,
      baseImageMeta.height!
    );
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const image = await loadImage(baseImageBuffer);
    ctx.drawImage(
      image,
      (canvas.width - baseImageMeta.width!) / 2,
      0,
      baseImageMeta.width!,
      baseImageMeta.height!
    );
    const finalImage = Buffer.from(canvas.toDataURL().split(",")[1], "base64");
    res.setHeader("Content-Type", "image/png");
    res.send(finalImage);
  } catch (error) {
    console.log(error);
    res.setHeader("Content-Type", response.headers["content-type"]);
    res.send(response.data);
  }
};
