export const forgeLaunchKey = (contract: string, claim: number) => [
  "drop-forge-launch",
  contract.toLowerCase(),
  claim,
];

export const forgeSettingsKey = (address?: string | null) => [
  "drop-forge-settings",
  address?.toLowerCase(),
];
