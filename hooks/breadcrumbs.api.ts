import { commonApiFetch } from "../services/api/common-api";
import { MEMELAB_CONTRACT, MEMES_CONTRACT } from "../constants";
import { NextGenToken } from "../entities/INextgen";

export const fetchGradientName = async (
  id: string
): Promise<{ name: string } | null> => {
  if (!id || typeof id !== "string") return null;
  try {
    const response = await commonApiFetch<{
      data?: [{ name: string }];
    }>({
      endpoint: "nfts/gradients",
      params: { id },
    });
    const nftData = response?.data?.[0];
    return nftData ? { name: nftData.name } : null;
  } catch (error) {
    console.error("Error fetching gradient name:", error);
    return { name: `Gradient ${id}` };
  }
};

export const fetchProfileHandle = async (
  handle: string
): Promise<{ handle: string } | null> => {
  if (!handle || typeof handle !== "string") return null;
  try {
    await new Promise((resolve) => setTimeout(resolve, 50)); // Simulate network delay
    return { handle: handle };
  } catch (error) {
    console.error("Error fetching profile handle:", error);
    return { handle: handle };
  }
};

export const fetchWaveName = async (id: string): Promise<{ name: string } | null> => {
  if (!id || typeof id !== "string") return null;
  try {
    const response = await commonApiFetch<{ name: string }>({
      endpoint: `waves/${id}`,
    });
    return response ? { name: response.name } : null;
  } catch (error) {
    console.error("Error fetching wave name:", error);
    return { name: `Wave ${id}` };
  }
};

export const fetchMemeName = async (id: string): Promise<{ name: string } | null> => {
  if (!id || typeof id !== "string") return null;
  try {
    const response = await commonApiFetch<{
      data?: [{ name: string }];
    }>({
      endpoint: "nfts",
      params: { contract: MEMES_CONTRACT, id },
    });
    const nftData = response?.data?.[0];
    return nftData?.name ? { name: nftData.name } : null;
  } catch (error) {
    console.error("Error fetching meme name:", error);
    return { name: `Meme ${id}` };
  }
};

export const fetchNextgenName = async (
  id: string
): Promise<{ name: string } | null> => {
  if (!id || typeof id !== "string") return null;
  try {
    const response = await commonApiFetch<NextGenToken>({
      endpoint: `nextgen/tokens/${id}`,
    });
    return response?.name ? { name: response.name } : null;
  } catch (error) {
    console.error("Error fetching nextgen name:", error);
    return { name: `Nextgen ${id}` };
  }
};

export const fetchRememeName = async (
  contract: string,
  id: string
): Promise<{ name: string } | null> => {
  if (!id || typeof id !== "string") return null;
  try {
    const response = await commonApiFetch<any>({ // Consider a more specific type if possible
      endpoint: `rememes`,
      params: { contract, id },
    });
    if (response?.data?.length > 0) {
      return { name: response.data[0].metadata?.name };
    }
    return { name: `Rememe ${id}` };
  } catch (error) {
    console.error("Error fetching rememe name:", error);
    return { name: `Rememe ${id}` };
  }
};

export const fetchMemeLabName = async (
  id: string
): Promise<{ name: string } | null> => {
  if (!id || typeof id !== "string") return null;
  try {
    const response = await commonApiFetch<any>({ // Consider a more specific type
      endpoint: `nfts_memelab`,
      params: {
        contract: MEMELAB_CONTRACT,
        id,
      },
    });
    if (response?.data?.length > 0) {
      return { name: response.data[0].name };
    }
    return { name: `Meme Lab ${id}` };
  } catch (error) {
    console.error("Error fetching meme lab name:", error);
    return { name: `Meme Lab ${id}` };
  }
};

export const fetchCollectionName = async (
  id: string
): Promise<{ name: string } | null> => {
  if (!id || typeof id !== "string") return null;
  try {
    const response = await commonApiFetch<{
      data?: [{ name: string }];
    }>({
      endpoint: "collections",
      params: { id },
    });
    const collectionData = response?.data?.[0];
    return collectionData?.name ? { name: collectionData.name } : null;
  } catch (error) {
    console.error("Error fetching collection name:", error);
    return { name: `Collection ${id}` };
  }
}; 
