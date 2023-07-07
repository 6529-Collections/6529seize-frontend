import puppeteer from "puppeteer";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { token } = req.query;

  try {
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();

    await page.goto(
      `${process.env.REACT_APP_BASE_ENDPOINT}/api/generator/html/${token}`
    );

    const canvasHandle = await page.$("canvas");
    const screenshot = await canvasHandle?.screenshot({ type: "png" });

    await browser.close();

    if (screenshot) {
      res.setHeader("Content-Type", "image/png");
      res.status(200).send(screenshot);
    } else {
      res
        .status(500)
        .send({ error: "An error occurred while capturing the canvas." });
    }
  } catch (error) {
    res
      .status(500)
      .send({ error: "An error occurred while processing the page." });
  }
}
