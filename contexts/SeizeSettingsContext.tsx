import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { ApiSeizeSettings } from "../generated/models/ApiSeizeSettings";
import { fetchUrl } from "../services/6529api";

const SeizeSettingsContext = createContext<ApiSeizeSettings | undefined>(
  undefined
);

export const SeizeSettingsProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [seizeSettings, setSeizeSettings] = useState<
    ApiSeizeSettings | undefined
  >(undefined);

  useEffect(() => {
    fetchUrl(`${process.env.API_ENDPOINT}/api/settings`).then(
      (settings: ApiSeizeSettings) => {
        setSeizeSettings(settings);
      }
    );
  }, []);

  return (
    <SeizeSettingsContext.Provider value={seizeSettings}>
      {children}
    </SeizeSettingsContext.Provider>
  );
};

export const useSeizeSettings = (): ApiSeizeSettings => {
  const context = useContext(SeizeSettingsContext);
  if (context === undefined) {
    throw new Error(
      "useSeizeSettings must be used within a SeizeSettingsProvider"
    );
  }
  return context;
};
