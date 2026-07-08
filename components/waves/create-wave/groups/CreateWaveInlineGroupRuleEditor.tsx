import GroupCreateCIC from "@/components/groups/page/create/config/GroupCreateCIC";
import GroupCreateLevel from "@/components/groups/page/create/config/GroupCreateLevel";
import GroupCreateRep from "@/components/groups/page/create/config/GroupCreateRep";
import GroupCreateTDH from "@/components/groups/page/create/config/GroupCreateTDH";
import GroupCreateCollections from "@/components/groups/page/create/config/nfts/GroupCreateCollections";
import GroupCreateNfts from "@/components/groups/page/create/config/nfts/GroupCreateNfts";
import { ApiGroupBeneficiaryGrantMatchMode } from "@/generated/models/ApiGroupBeneficiaryGrantMatchMode";
import type { ApiCreateGroup } from "@/generated/models/ApiCreateGroup";
import { assertUnreachable } from "@/helpers/AllowlistToolHelpers";
import { CreateWaveInlineGroupRuleType } from "./createWaveInlineGroupBuilder";
import CreateWaveInlineGroupXtdhGrant from "./CreateWaveInlineGroupXtdhGrant";

export default function CreateWaveInlineGroupRuleEditor({
  draft,
  activeRule,
  onDraftChange,
}: {
  readonly draft: ApiCreateGroup;
  readonly activeRule: CreateWaveInlineGroupRuleType | null;
  readonly onDraftChange: (draft: ApiCreateGroup) => void;
}) {
  if (activeRule === null) {
    return null;
  }

  switch (activeRule) {
    case CreateWaveInlineGroupRuleType.LEVEL:
      return (
        <GroupCreateLevel
          level={draft.group.level}
          setLevel={(level) =>
            onDraftChange({
              ...draft,
              group: { ...draft.group, level },
            })
          }
        />
      );
    case CreateWaveInlineGroupRuleType.TDH:
      return (
        <GroupCreateTDH
          tdh={draft.group.tdh}
          setTDH={(tdh) =>
            onDraftChange({
              ...draft,
              group: { ...draft.group, tdh },
            })
          }
        />
      );
    case CreateWaveInlineGroupRuleType.CIC:
      return (
        <GroupCreateCIC
          cic={draft.group.cic}
          setCIC={(cic) =>
            onDraftChange({
              ...draft,
              group: { ...draft.group, cic },
            })
          }
        />
      );
    case CreateWaveInlineGroupRuleType.REP:
      return (
        <GroupCreateRep
          rep={draft.group.rep}
          setRep={(rep) =>
            onDraftChange({
              ...draft,
              group: { ...draft.group, rep },
            })
          }
        />
      );
    case CreateWaveInlineGroupRuleType.NFTS:
      return (
        <GroupCreateNfts
          nfts={draft.group.owns_nfts}
          setNfts={(owns_nfts) =>
            onDraftChange({
              ...draft,
              group: { ...draft.group, owns_nfts },
            })
          }
        />
      );
    case CreateWaveInlineGroupRuleType.COLLECTIONS:
      return (
        <GroupCreateCollections
          nfts={draft.group.owns_nfts}
          setNfts={(owns_nfts) =>
            onDraftChange({
              ...draft,
              group: { ...draft.group, owns_nfts },
            })
          }
        />
      );
    case CreateWaveInlineGroupRuleType.XTDH_GRANT:
      return (
        <CreateWaveInlineGroupXtdhGrant
          beneficiaryGrantId={draft.group.is_beneficiary_of_grant_id}
          beneficiaryGrantMatchMode={
            draft.group.is_beneficiary_of_grant_match_mode
          }
          setBeneficiaryGrantId={(is_beneficiary_of_grant_id) =>
            onDraftChange({
              ...draft,
              group: {
                ...draft.group,
                is_beneficiary_of_grant_id: is_beneficiary_of_grant_id ?? null,
                ...(is_beneficiary_of_grant_id
                  ? {}
                  : {
                      is_beneficiary_of_grant_match_mode:
                        ApiGroupBeneficiaryGrantMatchMode.AnyToken,
                    }),
              },
            })
          }
          setBeneficiaryGrantMatchMode={(is_beneficiary_of_grant_match_mode) =>
            onDraftChange({
              ...draft,
              group: {
                ...draft.group,
                is_beneficiary_of_grant_match_mode:
                  is_beneficiary_of_grant_match_mode ??
                  ApiGroupBeneficiaryGrantMatchMode.AnyToken,
              },
            })
          }
        />
      );
    default:
      return assertUnreachable(activeRule);
  }
}
