export const DELEGATION_CONSOLIDATION_BUILDER_MESSAGES = {
  "delegation.consolidationBuilder.title": "Build a Consolidation",
  "delegation.consolidationBuilder.metadataDescription":
    "Plan and sign the links between up to {limit} wallets you control, one transaction per wallet.",
  "delegation.consolidationBuilder.description":
    "Every pair of wallets in a consolidation registers a link in both directions. Enter up to {limit} wallets you control, then sign one transaction per wallet in the order shown.",
  "delegation.consolidationBuilder.closeTitle": "Consolidation",
  "delegation.consolidationBuilder.entry": "Guided Setup",
  "delegation.consolidationBuilder.warnings.title": "Before you start",
  "delegation.consolidationBuilder.warnings.control":
    "Every wallet in a consolidation can sign in as your profile and act for it. Only consolidate wallets you control.",
  "delegation.consolidationBuilder.warnings.merge":
    "The wallets’ profiles merge permanently. The profile with the highest CIC keeps its handle.",
  "delegation.consolidationBuilder.warnings.order":
    "Sign in the order shown. Signing out of order temporarily splits your consolidation and can reduce your TDH-wave votes.",
  "delegation.consolidationBuilder.warnings.leave":
    "A wallet that is already in another consolidation will leave it.",
  "delegation.consolidationBuilder.warnings.tdhLink":
    "How consolidation affects TDH",
  "delegation.consolidationBuilder.warnings.docsLink": "Consolidation guide",
  "delegation.consolidationBuilder.wallets.title": "Wallets",
  "delegation.consolidationBuilder.wallets.count": "{count} of {limit} wallets",
  "delegation.consolidationBuilder.wallets.label": "Wallet {position}",
  "delegation.consolidationBuilder.wallets.inputLabel":
    "Wallet {position} address",
  "delegation.consolidationBuilder.wallets.placeholder": "0x…",
  "delegation.consolidationBuilder.wallets.connected": "Connected",
  "delegation.consolidationBuilder.wallets.member": "In current consolidation",
  "delegation.consolidationBuilder.wallets.remove": "Remove wallet {position}",
  "delegation.consolidationBuilder.wallets.add": "Add Wallet",
  "delegation.consolidationBuilder.wallets.limitReached":
    "A consolidation can hold up to {limit} wallets.",
  "delegation.consolidationBuilder.wallets.loadingGroup":
    "Loading your current consolidation…",
  "delegation.consolidationBuilder.wallets.groupError":
    "Couldn’t load the current consolidations of these wallets.",
  "delegation.consolidationBuilder.wallets.invalid":
    "Enter a wallet address: 0x followed by 40 hexadecimal characters.",
  "delegation.consolidationBuilder.wallets.duplicate":
    "This wallet is already listed.",
  "delegation.consolidationBuilder.wallets.departure":
    "{wallets} will leave the current consolidation with {others}.",
  "delegation.consolidationBuilder.retry": "Try Again",
  "delegation.consolidationBuilder.steps.title": "Signing steps",
  "delegation.consolidationBuilder.steps.description":
    "One transaction per wallet. Wallets already in your consolidation sign first; new wallets sign last.",
  "delegation.consolidationBuilder.steps.incomplete":
    "Enter at least two valid wallets to see the steps.",
  "delegation.consolidationBuilder.steps.loading":
    "Checking registered links on-chain…",
  "delegation.consolidationBuilder.steps.readError":
    "Couldn’t read the registered links on-chain.",
  "delegation.consolidationBuilder.steps.groupError":
    "The steps appear once the current consolidations of these wallets load.",
  "delegation.consolidationBuilder.steps.nothingToDo":
    "Every link between these wallets is already registered. There is nothing to sign.",
  "delegation.consolidationBuilder.steps.allComplete":
    "All steps are confirmed. Your consolidation updates within minutes, and TDH fully updates at the next 00:00 UTC snapshot.",
  "delegation.consolidationBuilder.steps.step": "Step {step}",
  "delegation.consolidationBuilder.steps.signs": "{wallet} signs",
  "delegation.consolidationBuilder.steps.linksTo": "Links to {wallets}",
  "delegation.consolidationBuilder.steps.oneRegistration": "1 registration",
  "delegation.consolidationBuilder.steps.batchRegistrations":
    "{count} registrations in one transaction",
  "delegation.consolidationBuilder.steps.status.complete": "Confirmed",
  "delegation.consolidationBuilder.steps.status.current": "Next",
  "delegation.consolidationBuilder.steps.status.upcoming": "Waiting",
  "delegation.consolidationBuilder.steps.sign": "Sign Step {step}",
  "delegation.consolidationBuilder.steps.connect": "Connect Wallet",
  "delegation.consolidationBuilder.steps.hint.disconnected":
    "Connect {wallet} ({address}) to sign this step.",
  "delegation.consolidationBuilder.steps.hint.wrongWallet":
    "Switch your wallet to {wallet} ({address}) to sign this step.",
  "delegation.consolidationBuilder.steps.hint.earlierSteps":
    "Available once the earlier steps are confirmed.",
  "delegation.consolidationBuilder.steps.hint.fourthSlot":
    "Available from {date}.",
  "delegation.consolidationBuilder.steps.hint.fourthSlotUnreachable":
    "Not available: these wallets cannot form a four-wallet consolidation.",
  "delegation.consolidationBuilder.steps.hint.resolving":
    "Checking your wallet connection…",
  "delegation.consolidationBuilder.fourthSlot.finalStep":
    "Four-wallet consolidations count from {date}. You can sign the other steps now; the last step opens then.",
  "delegation.consolidationBuilder.fourthSlot.allSteps":
    "Four-wallet consolidations count from {date}. Some of these links were registered earlier, so the remaining steps open then.",
  "delegation.consolidationBuilder.fourthSlot.unreachable":
    "Four-wallet consolidations count from {date}, and one wallet’s three links must all be completed from then on. Every wallet here already has a completed link, so these steps cannot form a four-wallet consolidation.",
  "delegation.consolidationBuilder.outOfOrder":
    "Some new wallets registered links before the wallets already in your consolidation. Your consolidation may be split until the last step confirms, so sign the remaining steps back to back.",
  "delegation.consolidationBuilder.toast.title": "Consolidation Step {step}",
  "delegation.consolidationBuilder.toast.failed":
    "Consolidation Step {step} Failed",
  "delegation.consolidationBuilder.toast.startFailed":
    "Failed to start the transaction.",
  "delegation.consolidationBuilder.toast.confirmationFailed":
    "Transaction failed while waiting for confirmation.",
} as const;
