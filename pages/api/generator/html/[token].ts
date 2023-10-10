import { NextApiRequest, NextApiResponse } from "next";
import Web3 from "web3";
import { NEXTGEN_CORE } from "../../../../components/nextGen/contracts";
import { mainnet, goerli } from "wagmi/chains";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { token } = req.query;

  let providerUrl;
  if ((NEXTGEN_CORE.chain_id as number) === mainnet.id) {
    providerUrl = `https://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_API_KEY}`;
  } else if ((NEXTGEN_CORE.chain_id as number) === goerli.id) {
    providerUrl = `https://eth-goerli.alchemyapi.io/v2/${process.env.ALCHEMY_API_KEY}`;
  }

  const web3 = new Web3(providerUrl);
  const contract = new web3.eth.Contract(
    NEXTGEN_CORE.abi,
    NEXTGEN_CORE.contract
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
