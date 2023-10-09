import { NextApiRequest, NextApiResponse } from "next";
import { NEXT_GEN_ABI } from "../../../../abis";
import { NEXT_GEN_CONTRACT } from "../../../../constants";
import Web3 from "web3";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { token } = req.query;
  let collection = 0;
  if (token) {
    const tokenparts = token.toString().split(`0`);
    if (tokenparts.length >= 2) {
      collection = parseInt(tokenparts[0]);
    }
  }

  const providerUrl = `https://eth-goerli.alchemyapi.io/v2/${process.env.ALCHEMY_API_KEY}`;

  const web3 = new Web3(providerUrl);
  const contract = new web3.eth.Contract(
    NEXT_GEN_ABI,
    NEXT_GEN_CONTRACT.contract
  );

  try {
    const data: any = await contract.methods
      // @ts-ignore
      .retrieveCollectionInfo(collection)
      .call();
    const description = data[2];
    const external_url = data[3];
    const image = `${process.env.REACT_APP_BASE_ENDPOINT}/api/generator/png/${token}`;
    const animation_url = `${process.env.REACT_APP_BASE_ENDPOINT}/api/generator/html/${token}`;
    res.setHeader("Content-Type", "application/json");
    res.send({ name: token, description, external_url, image, animation_url });
  } catch (error) {
    console.log("error", error);
    res.setHeader("Content-Type", "text/html");
    res.send(error);
  }
}
