"use client";

import { publicEnv } from "@/config/env";
import {
  parseDecentralizedMediaRef,
  to6529ResolverUrl,
} from "@/lib/media/decentralized-media";
import type IpfsService from "./IPFSService";

const readIpfsConfig = () => {
  const apiEndpoint = publicEnv.IPFS_API_ENDPOINT;

  if (!apiEndpoint) {
    throw new Error("Missing IPFS_API_ENDPOINT");
  }

  const mfsPath = publicEnv.IPFS_MFS_PATH;

  return {
    apiEndpoint,
    mfsPath,
  } as const;
};

let ipfsServicePromise: Promise<IpfsService> | null = null;

const createIpfsService = async (): Promise<IpfsService> => {
  const config = readIpfsConfig();
  const { default: IpfsServiceClass } = await import("./IPFSService");
  const service = new IpfsServiceClass(config);
  try {
    // Prepare the MFS folder before the first copy into it. A failure is
    // logged and uploads still go to IPFS, as when this ran at app start.
    await service.init();
  } catch (error: unknown) {
    console.error("Error initializing IPFS service", error);
  }
  return service;
};

// Uploads are rare (profile pictures), so the IPFS client loads and prepares
// on the first upload instead of for every visitor at app start.
const getIpfsService = (): Promise<IpfsService> => {
  ipfsServicePromise ??= createIpfsService().catch((error: unknown) => {
    ipfsServicePromise = null;
    throw error;
  });
  return ipfsServicePromise;
};

export const addFileToIpfs = async (file: File): Promise<string> => {
  const service = await getIpfsService();
  return service.addFile(file);
};

export const resolveIpfsUrlSync = (url: string) => {
  try {
    const parsed = parseDecentralizedMediaRef(url);
    if (!parsed) {
      return url;
    }

    return to6529ResolverUrl(parsed, publicEnv.MEDIA_RESOLVER_ENDPOINT);
  } catch (error) {
    console.error("Error resolving IPFS URL", error);
    return url;
  }
};

export const resolveIpfsUrl = (url: string) => {
  return resolveIpfsUrlSync(url);
};
