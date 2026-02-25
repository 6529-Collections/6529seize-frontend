"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { publicEnv } from "@/config/env";

import IpfsService from "./IPFSService";

interface IpfsContextType {
  ipfsService: IpfsService | null;
}

const IpfsContext = createContext<IpfsContextType | undefined>(undefined);

const readIpfsConfig = () => {
  const apiEndpoint = publicEnv.IPFS_API_ENDPOINT;
  const gatewayEndpoint = publicEnv.IPFS_GATEWAY_ENDPOINT;

  if (!apiEndpoint || !gatewayEndpoint) {
    throw new Error("Missing IPFS_API_ENDPOINT or IPFS_GATEWAY_ENDPOINT");
  }

  let trimmed = gatewayEndpoint;
  while (trimmed.endsWith("/")) {
    trimmed = trimmed.slice(0, -1);
  }

  const gatewayBase = trimmed.endsWith("/ipfs")
    ? trimmed.slice(0, -5)
    : trimmed;
  const mfsPath = publicEnv.IPFS_MFS_PATH;

  return {
    apiEndpoint,
    gatewayEndpoint: trimmed,
    gatewayBase,
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
  if (!url.startsWith("ipfs://")) {
    return url;
  }

  try {
    const { gatewayBase } = readIpfsConfig();
    return `${gatewayBase}/ipfs/${url.slice(7)}`;
  } catch (error) {
    console.error("Error resolving IPFS URL", error);
    return url;
  }
};

export const resolveIpfsUrl = (url: string) => {
  return resolveIpfsUrlSync(url);
};
