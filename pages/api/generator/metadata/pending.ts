import { NextApiRequest, NextApiResponse } from "next";
import { mainnet, goerli } from "wagmi/chains";
import Web3 from "web3";
import {
  NEXTGEN_CHAIN_ID,
  NEXTGEN_CORE,
} from "../../../../components/nextGen/contracts";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const image = `${process.env.REACT_APP_BASE_ENDPOINT}/nextgen-placeholder.png`;
    res.setHeader("Content-Type", "application/json");
    res.send({ name: "Pending...", description: "Pending...", image });
  } catch (error) {
    console.log("error", error);
    res.setHeader("Content-Type", "text/html");
    res.send(error);
  }
}
