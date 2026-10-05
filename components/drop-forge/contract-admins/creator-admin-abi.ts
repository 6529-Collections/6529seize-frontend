import { parseAbi } from "viem";

export const CREATOR_ADMIN_ABI = parseAbi([
  "function owner() view returns (address)",
  "function getAdmins() view returns (address[])",
  "function isAdmin(address) view returns (bool)",
  "function approveAdmin(address admin)",
  "function revokeAdmin(address admin)",
]);
