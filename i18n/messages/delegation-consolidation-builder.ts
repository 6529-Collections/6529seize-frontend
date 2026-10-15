export const DELEGATION_CONSOLIDATION_BUILDER_MESSAGES = {
  "delegation.consolidationBuilder.policy.loading":
    "Loading consolidation settings…",
  "delegation.consolidationBuilder.policy.unavailable":
    "Couldn’t load consolidation settings. Signing that requires unavailable settings is paused; try again.",
  "delegation.consolidationBuilder.title": "Build a Consolidation",
  "delegation.consolidationBuilder.metadataDescription":
    "Plan and sign the links between wallets you control, one transaction per wallet. A manager signing for a cold vault sends one per link.",
  "delegation.consolidationBuilder.description":
    "Every pair of wallets in a consolidation registers a link in both directions. Enter up to {limit} wallets you control, then sign one transaction per wallet in the order shown. A Delegation Manager signing for a cold vault sends one transaction per link instead.",
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
  "delegation.consolidationBuilder.warnings.managerTip":
    "Keeping a vault cold? Appoint a Delegation Manager for it on Any Collection first, so it never has to connect here.",
  "delegation.consolidationBuilder.warnings.managerLink":
    "Appoint a Delegation Manager",
  "delegation.consolidationBuilder.safe.guidance":
    "Safes sign through a manager here. Appoint a Delegation Manager for this Safe on Any Collection, then connect the manager to sign these links.",
  "delegation.consolidationBuilder.safe.faqLink": "Using a SAFE",
  "delegation.consolidationBuilder.wallets.title": "Wallets",
  "delegation.consolidationBuilder.wallets.countPending":
    "Entered wallets: {count}",
  "delegation.consolidationBuilder.wallets.count": "{count} of {limit} wallets",
  "delegation.consolidationBuilder.wallets.signingOpens":
    "Four-wallet signing opens {date}.",
  "delegation.consolidationBuilder.wallets.label": "Wallet {position}",
  "delegation.consolidationBuilder.wallets.inputLabel":
    "Wallet {position} address",
  "delegation.consolidationBuilder.wallets.placeholder": "0x… or ENS",
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
    "Enter a valid Ethereum address or a resolvable ENS name.",
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
  "delegation.consolidationBuilder.steps.loading": "Checking registered links…",
  "delegation.consolidationBuilder.steps.readError":
    "Couldn’t check the registered links.",
  "delegation.consolidationBuilder.steps.groupError":
    "The steps appear once the current consolidations of these wallets load.",
  "delegation.consolidationBuilder.steps.nothingToDo":
    "Every link between these wallets is already registered. There is nothing to sign.",
  "delegation.consolidationBuilder.steps.allComplete":
    "All steps are confirmed. Your consolidation updates within minutes, and TDH fully updates at the next 00:00 UTC snapshot.",
  "delegation.consolidationBuilder.steps.step": "Step {step}",
  "delegation.consolidationBuilder.steps.signs": "{wallet} signs",
  "delegation.consolidationBuilder.steps.managerSigns":
    "Manager signs for {wallet}",
  "delegation.consolidationBuilder.steps.linksTo": "Links to {wallets}",
  "delegation.consolidationBuilder.steps.oneRegistration": "1 registration",
  "delegation.consolidationBuilder.steps.batchRegistrations":
    "{count} registrations in one transaction",
  "delegation.consolidationBuilder.steps.managerRegistrations":
    "{count} registrations, one transaction each",
  "delegation.consolidationBuilder.steps.managerNote":
    "{wallet} stays cold: its manager signs these links for it, one transaction per link.",
  "delegation.consolidationBuilder.steps.managerSplitNote":
    "{wallet} stays cold: its manager signs these links for it, one transaction per link. Until the last one confirms, your consolidation can be split, which can reduce your TDH-wave votes. Send them back to back.",
  "delegation.consolidationBuilder.steps.status.complete": "Confirmed",
  "delegation.consolidationBuilder.steps.status.current": "Next",
  "delegation.consolidationBuilder.steps.status.upcoming": "Waiting",
  "delegation.consolidationBuilder.steps.status.recording": "Recording",
  "delegation.consolidationBuilder.steps.sign": "Sign Step {step}",
  "delegation.consolidationBuilder.steps.signAsManager":
    "Sign for {wallet} as its manager",
  "delegation.consolidationBuilder.steps.linkProgress":
    "Link {link} of {total}",
  "delegation.consolidationBuilder.steps.connect": "Connect Wallet",
  "delegation.consolidationBuilder.steps.hint.disconnected":
    "Connect {wallet} ({address}) or a wallet that manages it to sign this step.",
  "delegation.consolidationBuilder.steps.hint.wrongWallet":
    "Switch your wallet to {wallet} ({address}) or a wallet that manages it to sign this step.",
  "delegation.consolidationBuilder.steps.hint.earlierSteps":
    "Available once the earlier steps are confirmed.",
  "delegation.consolidationBuilder.steps.hint.fourthSlot":
    "Available from {date}.",
  "delegation.consolidationBuilder.steps.hint.resolving":
    "Checking your wallet connection…",
  "delegation.consolidationBuilder.steps.hint.checkingManager":
    "Checking whether the connected wallet manages {wallet}…",
  "delegation.consolidationBuilder.steps.hint.recording":
    "Waiting for 6529 to record this link (usually about a minute).",
  "delegation.consolidationBuilder.steps.progress.current":
    "Step {step} of {total} is next: {wallet} signs.",
  "delegation.consolidationBuilder.steps.progress.manager":
    "Step {step} of {total} is next: sign for {wallet} as its manager.",
  "delegation.consolidationBuilder.steps.progress.managerLink":
    "Step {step} of {total} is next: sign link {link} of {links} for {wallet} as its manager.",
  "delegation.consolidationBuilder.steps.progress.recording":
    "Step {step} is confirmed. Waiting for 6529 to record it.",
  "delegation.consolidationBuilder.fourthSlot.waits":
    "Four-wallet consolidations count only for links registered from {date}. Every step for this group opens at {opens}, a few minutes later, so no link can land before the start.",
  "delegation.consolidationBuilder.fourthSlot.staleLinks":
    "Some of these links were registered before {date}. They are registered again so they count for the fourth wallet.",
  "delegation.consolidationBuilder.outOfOrder":
    "Some new wallets registered links before the wallets already in your consolidation. Your consolidation may be split until the last step confirms, so sign the remaining steps back to back.",
  "delegation.consolidationBuilder.toast.title": "Consolidation Step {step}",
  "delegation.consolidationBuilder.toast.failed":
    "Consolidation Step {step} Failed",
  "delegation.consolidationBuilder.toast.linkTitle":
    "Consolidation Step {step}, Link {link} of {total}",
  "delegation.consolidationBuilder.toast.linkFailed":
    "Consolidation Step {step}, Link {link} of {total} Failed",
  "delegation.consolidationBuilder.toast.startFailed":
    "Failed to start the transaction.",
  "delegation.consolidationBuilder.toast.confirmationFailed":
    "Transaction failed while waiting for confirmation.",
} as const;
