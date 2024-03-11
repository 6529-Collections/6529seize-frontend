import { useContext, useState } from "react";
import CommonInput from "../../utils/input/CommonInput";
import CurationBuildFilterSelectStatement from "./CurationBuildFilterSelectStatement";
import {
  CurationFilterRequest,
  CurationFilterResponse,
  FilterDirection,
  GeneralFilter,
} from "../../../helpers/filters/Filters.types";
import CurationBuildFilterStatement from "./CurationBuildFilterStatement";
import CurationBuildFilterStatementsList from "./statements/CurationBuildFilterStatementsList";
import { useMutation } from "@tanstack/react-query";
import { commonApiPost } from "../../../services/api/common-api";
import { AuthContext } from "../../auth/Auth";

export enum CommunityCurationFilterStatement {
  TDH = "TDH",
  REP = "REP",
  CIC = "CIC",
  LEVEL = "LEVEL",
}

export default function CurationBuildFilter() {
  const { requestAuth, setToast, connectedProfile } = useContext(AuthContext);
  const [name, setName] = useState<string>("");
  const [statementType, setStatementType] =
    useState<CommunityCurationFilterStatement>(
      CommunityCurationFilterStatement.TDH
    );

  const [filters, setFilters] = useState<GeneralFilter>({
    tdh: { min: null, max: null },
    rep: {
      min: null,
      max: null,
      direction: FilterDirection.RECEIVED,
      user: null,
      category: null,
    },
    cic: {
      min: null,
      max: null,
      direction: FilterDirection.RECEIVED,
      user: null,
    },
    level: { min: null, max: null },
  });

  const [mutating, setMutating] = useState<boolean>(false);
  // new-curation-bbwy6HP4Jh2txKnmuKVGsp

  const addCurationFilterMutation = useMutation({
    mutationFn: async (body: CurationFilterRequest) =>
      await commonApiPost<CurationFilterRequest, CurationFilterResponse>({
        endpoint: `community-members-curation`,
        body,
      }),
    onSuccess: () => {
      setToast({
        message: "Curation filter updated.",
        type: "success",
      });
    },
    onError: (error) => {
      setToast({
        message: error as unknown as string,
        type: "error",
      });
    },
    onSettled: () => {
      setMutating(false);
    },
  });

  const makeCurationFilterVisibleMutation = useMutation({
    mutationFn: async (param: {
      id: string;
      body: { visible: true; old_version_id: string | null };
    }) =>
      await commonApiPost<
        { visible: true; old_version_id: string | null },
        CurationFilterResponse
      >({
        endpoint: `community-members-curation/${param.id}/visible`,
        body: param.body,
      }),
    onSuccess: () => {
      setToast({
        message: "Curation filter visible.",
        type: "success",
      });
    },
    onError: (error) => {
      setToast({
        message: error as unknown as string,
        type: "error",
      });
    },
    onSettled: () => {
      setMutating(false);
    },
  });

  const onSave = async () => {
    if (mutating) {
      return;
    }
    setMutating(true);
    const { success } = await requestAuth();
    if (!success) {
      setMutating(false);
      return;
    }
    const response = await addCurationFilterMutation.mutateAsync({
      name,
      criteria: filters,
    });
    console.log(response);
    const response2 = await makeCurationFilterVisibleMutation.mutateAsync({
      id: response.id,
      body: { visible: true, old_version_id: null },
    });
    console.log(response2);
  };

  return (
    <div className="tw-mt-8 tw-w-full tw-space-y-4">
      <div>BUIDL Filter</div>
      <CommonInput
        value={name}
        onChange={(newV) => setName(newV ?? "")}
        placeholder="Curation Name"
      />
      <CurationBuildFilterStatementsList
        filters={filters}
        setFilters={setFilters}
      />
      <CurationBuildFilterSelectStatement
        statementType={statementType}
        setStatementType={setStatementType}
      />
      <CurationBuildFilterStatement
        statementType={statementType}
        filters={filters}
        setFilters={setFilters}
      />
      <button onClick={onSave}>Save</button>
    </div>
  );
}
