import CommunityStatsGraphs from "../../communityStats/CommunityStatsGraphs";

export default function UserPageStatsTDHcharts({
  mainAddress,
}: {
  readonly mainAddress: string;
}) {
  return <CommunityStatsGraphs wallet={mainAddress} />;
}
