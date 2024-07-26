import Head from "next/head";
import { MEMELAB_CONTRACT } from "../../constants";
import { fetchUrl } from "../../services/6529api";
import { areEqualAddresses } from "../../helpers/Helpers";

export interface SharedHeadProps {
  id: string;
  name: string;
  image: string;
}

export function SharedHead(
  props: Readonly<{
    props: SharedHeadProps;
    contract: string;
    isDistribution?: boolean;
  }>
) {
  let path = "the-memes";
  if (areEqualAddresses(props.contract, MEMELAB_CONTRACT)) {
    path = "meme-lab";
  }
  path += `/${props.props.id}`;
  if (props.isDistribution) {
    path = `${path}/distribution`;
  }

  const pageProps = props.props;
  const pagenameFull = `${pageProps.name}${
    props.isDistribution ? " Distribution" : ""
  } | 6529 SEIZE`;

  return (
    <Head>
      <title>{pagenameFull}</title>
      <link rel="icon" href="/favicon.ico" />
      <meta name="description" content={pagenameFull} />
      <meta
        property="og:url"
        content={`${process.env.BASE_ENDPOINT}/${path}`}
      />
      <meta property="og:title" content={pageProps.name} />
      <meta property="og:image" content={pageProps.image} />
      <meta property="og:description" content="6529 SEIZE" />
      <meta name="twitter:card" content={pagenameFull} />
      <meta name="twitter:image:alt" content={pageProps.name} />
      <meta name="twitter:title" content={pageProps.name} />
      <meta name="twitter:description" content="6529 SEIZE" />
      <meta name="twitter:image" content={pageProps.image} />
    </Head>
  );
}

export async function getSharedServerSideProps(req: any, contract: string) {
  const id = req.query.id;
  let urlPath = "nfts";
  let name = `Meme Card #${id}`;
  if (areEqualAddresses(contract, MEMELAB_CONTRACT)) {
    urlPath = "nfts_memelab";
    name = `Meme Lab Card #${id}`;
  }
  const response = await fetchUrl(
    `${process.env.API_ENDPOINT}/api/${urlPath}?contract=${contract}&id=${id}`
  );
  let image = `${process.env.BASE_ENDPOINT}/Seize_Logo_Glasses_2.png`;
  if (response?.data?.length > 0) {
    name = `${response.data[0].name} | ${name}`;
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
    },
  };
}
