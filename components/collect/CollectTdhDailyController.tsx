"use client";

import {
  useEffect,
  useEffectEvent,
  useRef,
  useState,
  useLayoutEffect,
  type ReactNode,
} from "react";
import CollectTdhDailyControls from "./CollectTdhDailyControls";
import Button from "@/components/utils/button/Button";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { validCollectDailyInput } from "./collect-tdh-daily.helpers";
import type {
  CollectTdhDailyEstimate,
  CollectTdhDailyInput,
} from "./collect-tdh-daily.types";

interface Props<T> {
  /** Include profile membership, recipient, collection and all analysis-context changes. */
  readonly contextKey: string;
  readonly calculate:
    | ((
        input: CollectTdhDailyInput,
        signal: AbortSignal
      ) => Promise<CollectTdhDailyEstimate<T>>)
    | null;
  readonly onConnect: () => void;
  readonly renderResult: (
    payload: T,
    guardAction: (action: () => void) => () => void
  ) => ReactNode;
}

type Outcome<T> = {
  readonly input: CollectTdhDailyInput;
} & (
  | { readonly status: "ready"; readonly estimate: CollectTdhDailyEstimate<T> }
  | { readonly status: "error" }
);

/** Each edit chooses the driving field. Derived updates never start another request. */
export default function CollectTdhDailyController<T>(props: Props<T>) {
  return <DailyController key={props.contextKey} {...props} />;
}

function DailyController<T>({ calculate, onConnect, renderResult }: Props<T>) {
  const locale = useBrowserLocale();
  const [input, setInput] = useState<CollectTdhDailyInput>({
    mode: "daily_tdh",
    value: "",
  });
  const [outcome, setOutcome] = useState<Outcome<T> | null>(null);
  const [attempt, setAttempt] = useState(0);
  const generation = useRef(0);
  const currentOutcome = useRef<Outcome<T> | null>(null);
  useLayoutEffect(
    () => () => {
      generation.current++;
      currentOutcome.current = null;
    },
    []
  );
  const calculateLatest = useEffectEvent(
    async (request: CollectTdhDailyInput, signal: AbortSignal) =>
      calculate?.(request, signal)
  );
  const active = input.value !== "";
  const valid = validCollectDailyInput(input);
  const available = calculate !== null;

  useEffect(() => {
    if (!active || !valid || !available) return;
    const requestGeneration = ++generation.current;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      void calculateLatest(input, controller.signal)
        .then((estimate) => {
          if (
            controller.signal.aborted ||
            generation.current !== requestGeneration ||
            !estimate
          )
            return;
          const resolved: Outcome<T> = { input, status: "ready", estimate };
          currentOutcome.current = resolved;
          setOutcome(resolved);
        })
        .catch(() => {
          if (
            !controller.signal.aborted &&
            generation.current === requestGeneration
          )
            setOutcome({ input, status: "error" });
        });
    }, 350);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [active, valid, available, input, attempt]);

  const current = outcome?.input === input ? outcome : null;
  const estimate = current?.status === "ready" ? current.estimate : null;
  const status =
    current?.status ?? (active && valid && available ? "calculating" : "idle");
  const onRecalculate = () => {
    generation.current++;
    currentOutcome.current = null;
    setOutcome(null);
    setAttempt((value) => value + 1);
  };
  return (
    <div className="tw-min-w-0 tw-space-y-6">
      <CollectTdhDailyControls
        input={input}
        estimate={estimate}
        status={status}
        invalid={active && !valid}
        needsProfile={active && valid && !available}
        onChange={(next) => {
          generation.current++;
          currentOutcome.current = null;
          setOutcome(null);
          setInput(next);
        }}
        onRetry={onRecalculate}
        onConnect={onConnect}
      />
      {estimate &&
        renderResult(estimate.payload, (action) => () => {
          if (currentOutcome.current === current) action();
        })}
      {estimate && (
        <Button
          className="tw-min-h-11"
          variant="tertiary"
          onClick={onRecalculate}
        >
          {t(locale, "collect.tdhDaily.recalculate")}
        </Button>
      )}
    </div>
  );
}
