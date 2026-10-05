export const DROP_FORGE_ADMIN_MESSAGES = {
  "dropForge.admins.heading": "Contract Admins",
  "dropForge.admins.loadError":
    "Unable to load contract admins. Try refreshing.",
  "dropForge.admins.loading": "Loading contract admins...",
  "dropForge.admins.refresh": "Refresh contract admins",
  "dropForge.admins.owner": "Owner",
  "dropForge.admins.admin": "Admin",
  "dropForge.admins.revokeLabel": "Revoke admin {address}",
  "dropForge.admins.revokeTooltip": "Revoke admin",
  "dropForge.admins.addressLabel": "Admin wallet or ENS",
  "dropForge.admins.addressPlaceholder": "0x... or ENS",
  "dropForge.admins.add": "Add Admin",
  "dropForge.admins.review": "Review Admin",
  "dropForge.admins.revoke": "Revoke Admin",
  "dropForge.admins.confirmAdd": "Confirm Add Admin",
  "dropForge.admins.confirmRevoke": "Confirm Revoke",
  "dropForge.admins.cancel": "Cancel",
  "dropForge.admins.grantQuestion": "Grant creator-contract admin access?",
  "dropForge.admins.revokeQuestion": "Remove creator-contract admin access?",
  "dropForge.admins.ownerRequired":
    "Only the contract owner can authorize this transaction.",
  "dropForge.admins.nonOwnerWarning":
    "This wallet is not the owner. This transaction is expected to fail.",
  "dropForge.admins.ensError": "Unable to resolve this ENS name.",
  "dropForge.admins.invalidAddress":
    "Enter a valid wallet address or a resolvable ENS name.",
  "dropForge.admins.zeroAddress": "The zero address cannot be an admin.",
  "dropForge.admins.existingOwner": "This wallet is already the owner.",
  "dropForge.admins.existingAdmin": "This wallet is already an admin.",
  "dropForge.admins.resolving": "Resolving ENS...",
  "dropForge.admins.contextChanged":
    "Wallet or network changed. Review the admin change again.",
  "dropForge.admins.transactionChanged":
    "The admin transaction was reverted, cancelled, or replaced.",
  "dropForge.admins.transactionError":
    "Unable to complete the admin transaction.",
} as const;
