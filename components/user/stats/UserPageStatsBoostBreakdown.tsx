// import { TDHBoostBreakdown } from "../../../entities/ITDH";
// import { getRandomObjectId } from "../../../helpers/AllowlistToolHelpers";
// import { UserPageStatsTDHType } from "./UserPageStats";

// export default function UserPageStatsBoostBreakdown({
//   tdh,
// }: {
//   readonly tdh: UserPageStatsTDHType;
// }) {
//   if (!tdh?.boost_breakdown || !tdh.boost) {
//     return <></>;
//   }

//   function getMemeRow(name: string, breakdown: TDHBoostBreakdown | undefined) {
//     return (
//       <tr key={getRandomObjectId()}>
//         <td className="tw-px-8 sm:tw-px-10 lg:tw-pr-4 tw-whitespace-nowrap tw-group tw-py-3 tw-text-sm sm:tw-text-md tw-font-medium tw-text-iron-400">
//           {name}
//         </td>
//         <td className="tw-px-4 sm:tw-px-6 lg:tw-pr-4 tw-whitespace-nowrap tw-group tw-py-3 tw-text-sm sm:tw-text-md tw-font-medium tw-text-white-400 tw-text-center">
//           {breakdown?.available}
//         </td>
//         <td className="tw-px-4 sm:tw-px-6 lg:tw-pr-4 tw-whitespace-nowrap tw-group tw-py-3 tw-text-sm sm:tw-text-md tw-font-medium tw-text-white-400 tw-text-center">
//           {breakdown?.acquired ?? "-"}
//         </td>
//       </tr>
//     );
//   }

//   function getMemesRows() {
//     let rows = [];
//     rows.push(
//       <tr key={getRandomObjectId()}>
//         <td className="tw-px-4 sm:tw-px-6 lg:tw-pr-4 tw-whitespace-nowrap tw-group tw-pt-3 tw-text-sm sm:tw-text-md tw-font-medium tw-text-white-400">
//           Memes
//         </td>
//       </tr>
//     );
//     if (tdh?.boost_breakdown) {
//       rows.push(getMemeRow("Card Sets", tdh.boost_breakdown?.memes_card_sets));
//       if (tdh.boost_breakdown?.memes_card_sets?.acquired === 0) {
//         rows.push(getMemeRow("SZN1", tdh.boost_breakdown?.memes_szn1));
//         if (!tdh.boost_breakdown?.memes_szn1?.acquired) {
//           rows.push(getMemeRow("Genesis", tdh.boost_breakdown?.memes_genesis));
//           rows.push(
//             getMemeRow("Nakamoto", tdh.boost_breakdown?.memes_nakamoto)
//           );
//         }
//         rows.push(getMemeRow("SZN2", tdh.boost_breakdown?.memes_szn2));
//         rows.push(getMemeRow("SZN3", tdh.boost_breakdown?.memes_szn3));
//         rows.push(getMemeRow("SZN4", tdh.boost_breakdown?.memes_szn4));
//         rows.push(getMemeRow("SZN5", tdh.boost_breakdown?.memes_szn5));
//       }
//     }

//     return rows;
//   }

//   function getBaseBoostRow(name: string, breakdown?: TDHBoostBreakdown) {
//     if (breakdown) {
//       return (
//         <tr key={getRandomObjectId()}>
//           <td className="tw-border-t tw-border-x-0 tw-border-b-0 tw-border-solid tw-border-iron-900 tw-px-4 sm:tw-px-6 lg:tw-pr-4 tw-whitespace-nowrap tw-group tw-py-3 tw-text-sm sm:tw-text-md tw-font-medium tw-text-white-400">
//             {name}
//           </td>
//           <td className="tw-border-t tw-border-x-0 tw-border-b-0 tw-border-solid tw-border-iron-900 tw-px-4 sm:tw-px-6 lg:tw-pr-4 tw-whitespace-nowrap tw-group tw-py-3 tw-text-sm sm:tw-text-md tw-font-medium tw-text-white-400 tw-text-center">
//             {breakdown?.available}
//           </td>
//           <td className="tw-border-t tw-border-x-0 tw-border-b-0 tw-border-solid tw-border-iron-900 tw-px-4 sm:tw-px-6 lg:tw-pr-4 tw-whitespace-nowrap tw-group tw-py-3 tw-text-sm sm:tw-text-md tw-font-medium tw-text-white-400 tw-text-center">
//             {breakdown?.acquired ?? "-"}
//           </td>
//         </tr>
//       );
//     }

//     return <></>;
//   }

//   return (
//     <div className="tw-mt-6 lg:tw-mt-8">
//       <div className="tw-flex">
//         <h3 className="tw-mb-0 tw-text-lg tw-font-semibold tw-text-iron-50">
//           Boost Breakdown
//         </h3>
//       </div>
//       <div className="tw-mt-2 lg:tw-mt-4 tw-bg-iron-950 tw-border tw-border-iron-700 tw-border-solid tw-rounded-lg tw-overflow-x-auto">
//         <div className="tw-flow-root">
//           <div className="tw-inline-block tw-min-w-full tw-align-middle">
//             <table className="tw-min-w-full">
//               <thead className="tw-bg-iron-900">
//                 <tr key={getRandomObjectId()}>
//                   <th
//                     scope="col"
//                     className="tw-px-4 sm:tw-px-6 lg:tw-pr-4 tw-whitespace-nowrap tw-group tw-py-3 tw-text-sm sm:tw-text-md tw-font-medium tw-text-iron-400">
//                     Type
//                   </th>
//                   <th
//                     scope="col"
//                     className="tw-px-4 sm:tw-px-6 lg:tw-pr-4 tw-whitespace-nowrap tw-group tw-py-3 tw-text-sm sm:tw-text-md tw-font-medium tw-text-iron-400  tw-text-center">
//                     Available Boost
//                   </th>
//                   <th
//                     scope="col"
//                     className="tw-px-4 sm:tw-px-6 lg:tw-pr-4 tw-whitespace-nowrap tw-group tw-py-3 tw-text-sm sm:tw-text-md tw-font-medium tw-text-iron-400 tw-text-center">
//                     Eligible Boost
//                   </th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {tdh?.boost_breakdown && (
//                   <>
//                     {getMemesRows()}
//                     {getBaseBoostRow(
//                       "Gradients",
//                       tdh?.boost_breakdown.gradients
//                     )}
//                     {getBaseBoostRow("ENS", tdh?.boost_breakdown.ens)}
//                     {getBaseBoostRow("Profile", tdh?.boost_breakdown.profile)}
//                     <tr key={getRandomObjectId()}>
//                       <td className="tw-border-t tw-border-x-0 tw-border-b-0 tw-border-solid tw-border-iron-700 tw-px-4 sm:tw-px-6 lg:tw-pr-4 tw-whitespace-nowrap tw-group tw-py-3 tw-text-sm sm:tw-text-md tw-font-medium tw-text-white-400">
//                         TOTAL BOOST
//                       </td>
//                       <td className="tw-border-t tw-border-x-0 tw-border-b-0 tw-border-solid tw-border-iron-700 tw-px-4 sm:tw-px-6 lg:tw-pr-4 tw-whitespace-nowrap tw-group tw-py-3 tw-text-sm sm:tw-text-md tw-font-medium tw-text-white-400 tw-text-center"></td>
//                       <td className="tw-border-t tw-border-x-0 tw-border-b-0 tw-border-solid tw-border-iron-700 tw-px-4 sm:tw-px-6 lg:tw-pr-4 tw-whitespace-nowrap tw-group tw-py-3 tw-text-sm sm:tw-text-md tw-font-medium tw-text-white-400 tw-text-center">
//                         {tdh?.boost
//                           ? `${Math.round((tdh.boost - 1) * 100) / 100}`
//                           : "-"}
//                       </td>
//                     </tr>
//                   </>
//                 )}
//               </tbody>
//             </table>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }
