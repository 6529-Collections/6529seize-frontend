export function getDisplay(lead: any) {
  if (lead.handle) {
    return lead.handle;
  }
  if (lead.consolidation_display) {
    return lead.consolidation_display;
  }
  return lead.wallet_display;
}

export function getDisplayEns(lead: any) {
  if (!lead.handle) {
    return;
  }
  if (lead.wallet_display?.includes(" ")) {
    return;
  }

  if (lead.wallet_display?.endsWith(".eth")) {
    return lead.wallet_display;
  }

  if (lead.consolidation_display?.includes(" ")) {
    return;
  }
  if (lead.consolidation_display?.endsWith(".eth")) {
    return lead.consolidation_display;
  }
  return;
}

export const getLink = (lead: any) => {
  if (lead.handle) {
    return `/${lead.handle}`;
  }
  return `/${lead.wallets.at(0)}`;
};

export const getLeaderboardProfileDisplay = (lead: any) =>
  getDisplay(lead) ?? getDisplayEns(lead);
