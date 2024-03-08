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

  const addRepMutation = useMutation({
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
    await addRepMutation.mutateAsync({
      name,
      criteria: filters,
    });
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
