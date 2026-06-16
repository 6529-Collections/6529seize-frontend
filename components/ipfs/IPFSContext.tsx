"use client";

import { publicEnv } from "@/config/env";
import {
  normalizeDecentralizedMediaUrl,
  parseDecentralizedMediaRef,
  to6529ResolverUrl,
} from "@/lib/media/decentralized-media";
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import IpfsService from "./IPFSService";

interface IpfsContextType {
  ipfsService: IpfsService | null;
}

const IpfsContext = createContext<IpfsContextType | undefined>(undefined);

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

const getEnv = async () => readIpfsConfig();

export const IpfsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [ipfsService, setIpfsService] = useState<IpfsService | null>(null);

  useEffect(() => {
    if (ipfsService) return;

    getEnv()
      .then((info) => {
        const service = new IpfsService({
          apiEndpoint: info.apiEndpoint,
          mfsPath: info.mfsPath,
        });
        service.init();
        setIpfsService(service);
      })
      .catch((error: unknown) => {
        console.error("Error initializing IPFS service", error);
      });
  }, [ipfsService]);

  const value = useMemo(() => ({ ipfsService }), [ipfsService]);

  return <IpfsContext.Provider value={value}>{children}</IpfsContext.Provider>;
};

export const useIpfsService = (): IpfsService => {
  const context = useContext(IpfsContext);
  if (!context?.ipfsService) {
    throw new Error("useIpfsService must be used within an IpfsProvider");
  }
  return context.ipfsService;
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

export const resolveDecentralizedMediaUrlSync = (url: string) =>
  normalizeDecentralizedMediaUrl(url, publicEnv.MEDIA_RESOLVER_ENDPOINT) ?? url;
