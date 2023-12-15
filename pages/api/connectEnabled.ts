import type { NextApiRequest, NextApiResponse } from "next";

type ResponseData = {
  disableConnect: boolean;
};

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  const disableConnect = process.env.DISABLE_CONNECT === "true";
  res.status(200).json({ disableConnect });
}
