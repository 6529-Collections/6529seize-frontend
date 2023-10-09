import { NextApiRequest, NextApiResponse } from "next";
import { NEXT_GEN_ABI } from "../../../../abis";
import { NEXT_GEN_CONTRACT } from "../../../../constants";
import Web3 from "web3";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { token } = req.query;

  const providerUrl = `https://eth-goerli.alchemyapi.io/v2/${process.env.ALCHEMY_API_KEY}`;

  const web3 = new Web3(providerUrl);
  const contract = new web3.eth.Contract(
    NEXT_GEN_ABI,
    NEXT_GEN_CONTRACT.contract
  );

  try {
    // @ts-ignore
    const data = await contract.methods.retrieveGenerativeScript(token).call();
    res.setHeader("Content-Type", "text/html");
    res.send(`<html>
      <head>
        <title>NextGen Token #${token}</title>
      </head>
      <body>
        <script>
          ${data}
        </script>
      </body>
    </html>`);
  } catch (error) {
    console.log("error", error);
    res.setHeader("Content-Type", "text/html");
    res.send(error);
  }
}
