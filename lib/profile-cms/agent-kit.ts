import packageSchema from "@/ops/workstreams/profile-native-cms-roadmap/phase-1/schemas/cms-package-v1.schema.json";
import contract from "./agent-kit-contract.json";
import { withComputedCmsHashes, type CmsPackageV1 } from "./protocol/v1";

export const CMS_AGENT_FILE_PROPOSAL_SCHEMA =
  "6529.cms.agent_file_proposal.v1" as const;

function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function getCmsAgentFileProposalSchema() {
  return cloneJson(contract.proposal_schema);
}

/** Export only the member's selected document; credentials are never inputs. */
export function createCmsAgentKit(cmsPackage: CmsPackageV1) {
  const document = withComputedCmsHashes(cloneJson(cmsPackage));
  return {
    schema: "6529.cms.agent_kit.v1" as const,
    base_package_hash: document.integrity.package_hash,
    cms_package: document,
    package_schema: cloneJson(packageSchema),
    proposal_schema: getCmsAgentFileProposalSchema(),
    constraints: cloneJson(contract.constraints),
    instructions: [...contract.instructions],
    proposal_example: {
      schema: CMS_AGENT_FILE_PROPOSAL_SCHEMA,
      base_package_hash: document.integrity.package_hash,
      candidate_package: cloneJson(document),
      summary: "Describe the changes requested by the website owner.",
    },
  };
}
