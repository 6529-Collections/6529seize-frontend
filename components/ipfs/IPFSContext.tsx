import React, { createContext, useContext, useMemo } from "react";
import IpfsService from "./IPFSService";

interface IpfsContextType {
  ipfsService: IpfsService;
}

const IpfsContext = createContext<IpfsContextType | undefined>(undefined);

const getEnv = () => {
  const domain = process.env.IPFS_DOMAIN;
  const rpcPort = process.env.IPFS_RPC_PORT;
  const gatewayPort = process.env.IPFS_GATEWAY_PORT;
  const mfsPath = process.env.IPFS_MFS_PATH;

  if (!domain || !rpcPort || !gatewayPort || !mfsPath) {
    throw new Error(
      "IPFS_DOMAIN, IPFS_RPC_PORT, IPFS_GATEWAY_PORT, and IPFS_MFS_PATH must be set"
    );
  }

  return { domain, rpcPort, gatewayPort, mfsPath };
};

export const IpfsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { domain, rpcPort, gatewayPort, mfsPath } = getEnv();

  const ipfsService = new IpfsService({
    baseDomain: domain,
    rpcPort: parseInt(rpcPort),
    gatewayPort: parseInt(gatewayPort),
    mfsPath: `/${mfsPath}`,
  });

  ipfsService.init();

  const value = useMemo(() => ({ ipfsService }), [ipfsService]);

  return <IpfsContext.Provider value={value}>{children}</IpfsContext.Provider>;
};

export const useIpfsService = (): IpfsService => {
  const context = useContext(IpfsContext);
  if (!context) {
    throw new Error("useIpfsService must be used within an IpfsProvider");
  }
  return context.ipfsService;
};

export const resolveIpfsUrl = (url: string) => {
  if (url.startsWith("ipfs://")) {
    const { domain, gatewayPort } = getEnv();
    return `${domain}:${gatewayPort}/ipfs/${url.slice(7)}`;
  }
  return url;
};
