import { useMutation, useQuery } from "@tanstack/react-query";
import { FormEvent, useEffect, useState } from "react";
import {
  commonApiFetch,
  commonApiPost,
} from "../../../services/api/common-api";
import { IProfileAndConsolidations } from "../../../entities/IProfile";
import { useAccount } from "wagmi";

interface ApiAddRepRatingToProfileRequest {
  readonly amount: number;
  readonly category: string;
}

export default function UserPageRep({
  profile,
}: {
  readonly profile: IProfileAndConsolidations;
}) {
  // this is YOUR connected account
  const connectedAddress = useAccount();
  // address is connectedAddress.address?.toLowerCase();

  // This is handle WHERE you are
  // profile.profile?.handle.toLowerCase()

  const get = async () => {
    const response = await commonApiFetch<any>({
      endpoint: `profiles/${profile.profile?.handle.toLowerCase()}`,
      // here you can pass params
      params: {},
    });
    console.log(response);
  };

  const post = async () => {
    const response = await commonApiPost<any, any>({
      endpoint: `profiles/${profile.profile?.handle.toLowerCase()}/rep/rating`,
      body: {
        amount: 1,
        category: "test",
      },
    });
    console.log(response);
  };

  return (
    <div>
      <button onClick={get}>GET</button>
      <button onClick={post}>POST</button>
    </div>
  );
}
