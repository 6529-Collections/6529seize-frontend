import { MEMELAB_CONTRACT } from "../../constants";
import { fetchUrl } from "../../services/6529api";
import { areEqualAddresses } from "../../helpers/Helpers";

export async function getSharedServerSideProps(
  req: any,
  contract: string,
  isDistribution: boolean = false
) {
  const id = req.query.id;
  let urlPath = "nfts";
  let name = `The Memes #${id}`;
  let description = "";
  if (areEqualAddresses(contract, MEMELAB_CONTRACT)) {
    urlPath = "nfts_memelab";
    name = `Meme Lab #${id}`;
  }
  if (isDistribution) {
    name = `${name} | Distribution`;
  }
  const response = await fetchUrl(
    `${process.env.API_ENDPOINT}/api/${urlPath}?contract=${contract}&id=${id}`
  );
  let image = `${process.env.BASE_ENDPOINT}/6529io.png`;
  if (response?.data?.length > 0) {
    description = name;
    name = `${response.data[0].name}`;
    if (response.data[0].thumbnail) {
      image = response.data[0].thumbnail;
    } else if (response.data[0].image) {
      image = response.data[0].image;
    }
  }
  return {
    props: {
      id: id,
      name: name,
      image: image,
      metadata: {
        title: name,
        description: description,
        ogImage: image,
        twitterCard: "summary",
      },
    },
  };
}
