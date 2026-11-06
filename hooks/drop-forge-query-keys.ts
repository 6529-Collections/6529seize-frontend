export const forgeLaunchKey = (contract: string, claim: number) => [
  "drop-forge-launch",
  contract.toLowerCase(),
  claim,
];
