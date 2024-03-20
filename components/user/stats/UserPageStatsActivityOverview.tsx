// import { useEffect, useState } from "react";
// import { UserPageStatsTDHType } from "./UserPageStats";
// import UserPageStatsTable, {
//   UserPageStatsTableItemData,
//   UserPageStatsTableProps,
// } from "./utils/table/UserPageStatsTable";
// import { formatNumberWithCommasOrDash } from "../../../helpers/Helpers";

// export default function UserPageStatsActivityOverview({
//   tdh,
// }: {
//   readonly tdh: UserPageStatsTDHType;
// }) {
//   const getTransfersIn = (
//     props: UserPageStatsTDHType
//   ): UserPageStatsTableItemData[] => {
//     if (!props) return [];
//     return [
//       {
//         title: "Transfers In",
//         isMain: true,
//         isLast: false,
//         tooltip: "Airdrops included",
//         total: formatNumberWithCommasOrDash(props.transfers_in),
//         memes: formatNumberWithCommasOrDash(props.transfers_in_memes),
//         gradient: formatNumberWithCommasOrDash(props.transfers_in_gradients),
//         SZN1: formatNumberWithCommasOrDash(props.transfers_in_memes_season1),
//         SZN2: formatNumberWithCommasOrDash(props.transfers_in_memes_season2),
//         SZN3: formatNumberWithCommasOrDash(props.transfers_in_memes_season3),
//         SZN4: formatNumberWithCommasOrDash(props.transfers_in_memes_season4),
//         SZN5: formatNumberWithCommasOrDash(props.transfers_in_memes_season5),
//         SZN6: formatNumberWithCommasOrDash(props.transfers_in_memes_season6),
//       },
//       {
//         title: "Purchases",
//         isMain: false,
//         isLast: false,
//         tooltip: null,
//         total: formatNumberWithCommasOrDash(props.purchases_count),
//         memes: formatNumberWithCommasOrDash(props.purchases_count_memes),
//         gradient: formatNumberWithCommasOrDash(props.purchases_count_gradients),
//         SZN1: formatNumberWithCommasOrDash(props.purchases_count_memes_season1),
//         SZN2: formatNumberWithCommasOrDash(props.purchases_count_memes_season2),
//         SZN3: formatNumberWithCommasOrDash(props.purchases_count_memes_season3),
//         SZN4: formatNumberWithCommasOrDash(props.purchases_count_memes_season4),
//         SZN5: formatNumberWithCommasOrDash(props.purchases_count_memes_season5),
//         SZN6: formatNumberWithCommasOrDash(props.purchases_count_memes_season6),
//       },
//       {
//         title: "Purchases (ETH)",
//         isMain: false,
//         isLast: true,
//         tooltip: null,
//         total: formatNumberWithCommasOrDash(+props.purchases_value?.toFixed(2)),
//         memes: formatNumberWithCommasOrDash(
//           +props.purchases_value_memes?.toFixed(2)
//         ),
//         gradient: formatNumberWithCommasOrDash(
//           +props?.purchases_value_gradients?.toFixed(2)
//         ),
//         SZN1: formatNumberWithCommasOrDash(
//           +props.purchases_value_memes_season1?.toFixed(2)
//         ),
//         SZN2: formatNumberWithCommasOrDash(
//           +props.purchases_value_memes_season2?.toFixed(2)
//         ),
//         SZN3: formatNumberWithCommasOrDash(
//           +props.purchases_value_memes_season3?.toFixed(2)
//         ),
//         SZN4: formatNumberWithCommasOrDash(
//           +props.purchases_value_memes_season4?.toFixed(2)
//         ),
//         SZN5: formatNumberWithCommasOrDash(
//           +props.purchases_value_memes_season5?.toFixed(2)
//         ),
//         SZN6: formatNumberWithCommasOrDash(
//           +props.purchases_value_memes_season6?.toFixed(2)
//         ),
//       },
//     ];
//   };

//   const getTransfersOut = (
//     props: UserPageStatsTDHType
//   ): UserPageStatsTableItemData[] => {
//     if (!props) return [];
//     return [
//       {
//         title: "Transfers Out",
//         isMain: true,
//         isLast: false,
//         tooltip: null,
//         total: formatNumberWithCommasOrDash(props.transfers_out),
//         memes: formatNumberWithCommasOrDash(props.transfers_out_memes),
//         gradient: formatNumberWithCommasOrDash(props.transfers_out_gradients),
//         SZN1: formatNumberWithCommasOrDash(props.transfers_out_memes_season1),
//         SZN2: formatNumberWithCommasOrDash(props.transfers_out_memes_season2),
//         SZN3: formatNumberWithCommasOrDash(props.transfers_out_memes_season3),
//         SZN4: formatNumberWithCommasOrDash(props.transfers_out_memes_season4),
//         SZN5: formatNumberWithCommasOrDash(props.transfers_out_memes_season5),
//         SZN6: formatNumberWithCommasOrDash(props.transfers_out_memes_season6),
//       },
//       {
//         title: "Sales",
//         isMain: false,
//         isLast: false,
//         tooltip: null,
//         total: formatNumberWithCommasOrDash(props.sales_count),
//         memes: formatNumberWithCommasOrDash(props.sales_count_memes),
//         gradient: formatNumberWithCommasOrDash(props.sales_count_gradients),
//         SZN1: formatNumberWithCommasOrDash(props.sales_count_memes_season1),
//         SZN2: formatNumberWithCommasOrDash(props.sales_count_memes_season2),
//         SZN3: formatNumberWithCommasOrDash(props.sales_count_memes_season3),
//         SZN4: formatNumberWithCommasOrDash(props.sales_count_memes_season4),
//         SZN5: formatNumberWithCommasOrDash(props.sales_count_memes_season5),
//         SZN6: formatNumberWithCommasOrDash(props.sales_count_memes_season6),
//       },
//       {
//         title: "Sales (ETH)",
//         isMain: false,
//         isLast: true,
//         tooltip: null,
//         total: formatNumberWithCommasOrDash(+props.sales_value?.toFixed(2)),
//         memes: formatNumberWithCommasOrDash(
//           +props.sales_value_memes?.toFixed(2)
//         ),
//         gradient: formatNumberWithCommasOrDash(
//           +props.sales_value_gradients?.toFixed(2)
//         ),
//         SZN1: formatNumberWithCommasOrDash(
//           +props.sales_value_memes_season1?.toFixed(2)
//         ),
//         SZN2: formatNumberWithCommasOrDash(
//           +props.sales_value_memes_season2?.toFixed(2)
//         ),
//         SZN3: formatNumberWithCommasOrDash(
//           +props.sales_value_memes_season3?.toFixed(2)
//         ),
//         SZN4: formatNumberWithCommasOrDash(
//           +props.sales_value_memes_season4?.toFixed(2)
//         ),
//         SZN5: formatNumberWithCommasOrDash(
//           +props.sales_value_memes_season5?.toFixed(2)
//         ),
//         SZN6: formatNumberWithCommasOrDash(
//           +props.sales_value_memes_season6?.toFixed(2)
//         ),
//       },
//     ];
//   };

//   const getData = (props: UserPageStatsTDHType): UserPageStatsTableProps => {
//     if (!props) return { title: "Activity Overview", data: [] };
//     return {
//       title: "Activity Overview",
//       data: [getTransfersIn(props), getTransfersOut(props)],
//     };
//   };

//   const [data, setData] = useState<UserPageStatsTableProps>(getData(tdh));

//   useEffect(() => setData(getData(tdh)), [tdh]);

//   return <UserPageStatsTable data={data} />;
// }
