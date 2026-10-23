"use client";
import { formatEther } from "viem";
import { getAddressEtherscanLink } from "@/helpers/Helpers";
import type { ApiDropForgeLaunch } from "@/generated/models/ApiDropForgeLaunch";
import {
  ApiDropForgeActionKindEnum as Kind,
  ApiDropForgeActionStateEnum as State,
  type ApiDropForgeAction,
} from "@/generated/models/ApiDropForgeAction";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import DropForgeTransactionRecovery from "./DropForgeTransactionRecovery";

function actionStatus(action: ApiDropForgeAction) {
  if (action.state === State.Confirmed)
    return action.observed
      ? ("dropForge.actionSkipped" as const)
      : ("dropForge.actionDone" as const);
  if (action.state === State.Cancelled)
    return "dropForge.actionCancelled" as const;
  if (action.state === State.Failed) return "dropForge.actionFailed" as const;
  if (action.state === State.Signed)
    return "dropForge.actionSubmitted" as const;
  return action.attempt_error
    ? ("dropForge.actionReadinessFailed" as const)
    : ("dropForge.actionPending" as const);
}
function groupActions(actions: ApiDropForgeAction[]) {
  const groups = new Map<string, ApiDropForgeAction[]>();
  for (const action of actions) {
    const id = action.group ?? `phase-${action.phase}`;
    const group = groups.get(id) ?? [];
    group.push(action);
    groups.set(id, group);
  }
  return Array.from(groups.entries());
}
function ActionRow({
  launch,
  action,
  onChange,
}: Readonly<{
  launch: ApiDropForgeLaunch;
  action: ApiDropForgeAction;
  onChange: () => Promise<unknown>;
}>) {
  const locale = useBrowserLocale();
  const explorer = (
    {
      1: "https://etherscan.io",
      11155111: "https://sepolia.etherscan.io",
    } as Partial<Record<number, string>>
  )[launch.chain_id];
  return (
    <li className="tw-text-sm tw-text-iron-200">
      <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-2">
        <span>
          {action.label ??
            (action.kind === Kind.Initialize
              ? t(locale, "dropForge.initialized")
              : launch.phases[action.phase]?.name)}
        </span>
        <span>{t(locale, actionStatus(action))}</span>
        {action.hash && explorer && (
          <a
            target="_blank"
            rel="noopener noreferrer"
            className="tw-text-primary-300"
            href={`${explorer}/tx/${action.hash}`}
          >
            {t(locale, "dropForge.transaction")}
          </a>
        )}
      </div>
      {action.payment_amount_wei && action.payment_recipient && (
        <p className="tw-my-1 tw-break-all tw-text-iron-300">
          {t(locale, "dropForge.settings.paymentDetails", {
            amount: formatEther(BigInt(action.payment_amount_wei)),
          })}
          {" · "}
          <a
            href={getAddressEtherscanLink(
              launch.chain_id,
              action.payment_recipient
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="tw-text-primary-300"
          >
            {action.payment_recipient}
          </a>
        </p>
      )}
      {action.disabled_reason && (
        <p className="tw-my-1 tw-text-iron-400">{action.disabled_reason}</p>
      )}
      {action.attempt_error && (
        <p role="alert" className="tw-my-1 tw-text-error">
          {action.attempt_error}
        </p>
      )}
      {action.attempt_error && action.state === State.Pending && (
        <p className="tw-my-1 tw-text-iron-400">
          {t(locale, "dropForge.actionRetryWindow")}
        </p>
      )}
      <DropForgeTransactionRecovery
        launch={launch}
        action={action}
        onChange={onChange}
      />
    </li>
  );
}
export default function DropForgeActionGroups({
  launch,
  onChange,
}: Readonly<{
  launch: ApiDropForgeLaunch;
  onChange: () => Promise<unknown>;
}>) {
  const locale = useBrowserLocale();
  return (
    <div className="tw-space-y-4">
      {groupActions(launch.actions).map(([id, actions]) => {
        const phase = actions[0]?.phase ?? 0;
        let title =
          launch.phases[phase]?.name ?? t(locale, "dropForge.phaseGroup");
        if (id === "phase-0") title = t(locale, "dropForge.openingGroup");
        if (id === "research") title = t(locale, "dropForge.researchGroup");
        if (id === "metadata") title = t(locale, "dropForge.metadataGroup");
        return (
          <section key={id} aria-label={title}>
            <h3 className="tw-text-base tw-font-medium tw-text-iron-100">
              {title}
            </h3>
            <ol className="tw-list-none tw-space-y-2 tw-p-0">
              {actions.map((action) => (
                <ActionRow
                  key={action.id}
                  action={action}
                  launch={launch}
                  onChange={onChange}
                />
              ))}
            </ol>
          </section>
        );
      })}
    </div>
  );
}
