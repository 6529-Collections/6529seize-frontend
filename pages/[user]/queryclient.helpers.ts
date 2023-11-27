import { QueryClient } from "@tanstack/react-query";
import { IProfileAndConsolidations } from "../../entities/IProfile";

// const populateProfile = ({
//   client,
//   profile,
// }: {
//   client: QueryClient,
//   profile: IProfileAndConsolidations,
// }) => {
//     if (profile.profile?.handle) {
//       queryClient.setQueryData<IProfileAndConsolidations>(
//         ["profile", pageProps.profile.profile?.handle.toLowerCase()],
//         pageProps.profile
//       );
//     }

//     for (const wallet of pageProps.profile.consolidation.wallets) {
//       queryClient.setQueryData<IProfileAndConsolidations>(
//         ["profile", wallet.wallet.address.toLowerCase()],
//         pageProps.profile
//       );

//       if (wallet.wallet.ens) {
//         queryClient.setQueryData<IProfileAndConsolidations>(
//           ["profile", wallet.wallet.ens.toLowerCase()],
//           pageProps.profile
//         );
//       }
//     }
// }