import React, { createContext, useContext, useMemo } from "react";
import IpfsService from "./IPFSService";

interface IpfsContextType {
  ipfsService: IpfsService;
}

const IpfsContext = createContext<IpfsContextType | undefined>(undefined);

const getEnv = () => {
  const apiEndpoint = process.env.IPFS_API_ENDPOINT;
  const gatewayEndpoint = process.env.IPFS_GATEWAY_ENDPOINT;

  if (!apiEndpoint || !gatewayEndpoint) {
    throw new Error("IPFS_API_ENDPOINT and IPFS_GATEWAY_ENDPOINT must be set");
  }

  const mfsPath = process.env.IPFS_MFS_PATH;

  return { apiEndpoint, gatewayEndpoint, mfsPath };
};

export const IpfsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  try {
    const { apiEndpoint, mfsPath } = getEnv();

    const ipfsService = new IpfsService({
      apiEndpoint,
      mfsPath,
    });

    ipfsService.init();

    const value = useMemo(() => ({ ipfsService }), [ipfsService]);

    return (
      <IpfsContext.Provider value={value}>{children}</IpfsContext.Provider>
    );
  } catch (error) {
    console.error("Error initializing IPFS service", error);
    return <>{children}</>;
  }
};

export const useIpfsService = (): IpfsService => {
  const context = useContext(IpfsContext);
  if (!context) {
    throw new Error("useIpfsService must be used within an IpfsProvider");
  }
  return context.ipfsService;
};

export const resolveIpfsUrl = (url: string) => {
  try {
    if (url.startsWith("ipfs://")) {
      const { gatewayEndpoint } = getEnv();
      return `${gatewayEndpoint}/ipfs/${url.slice(7)}`;
    }
  } catch (error) {
    console.error("Error resolving IPFS URL", error);
  }
  return url;
};
