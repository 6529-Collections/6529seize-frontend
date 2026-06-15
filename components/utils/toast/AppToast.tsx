"use client";

import "react-toastify/dist/ReactToastify.css";

import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";
import { isValidElement } from "react";
import type { MouseEvent, ReactNode } from "react";
import { Slide, toast, ToastContainer } from "react-toastify";
import type {
  Id,
  ToastContainerProps,
  ToastOptions,
  TypeOptions,
} from "react-toastify";

import {
  getFriendlyToastContent,
  getToastAutoClose,
  normalizeToastText,
} from "@/helpers/toast.helpers";

import styles from "./AppToast.module.scss";

export type AppToastAction = {
  readonly label: string;
  readonly href?: string | undefined;
  readonly onClick?: (() => void) | undefined;
  readonly external?: boolean | undefined;
};

export type AppToastInput = {
  readonly type: TypeOptions;
  readonly message?: ReactNode | undefined;
  readonly title?: ReactNode | undefined;
  readonly description?: ReactNode | undefined;
  readonly details?: ReactNode | undefined;
  readonly action?: AppToastAction | undefined;
  readonly autoClose?: number | false | undefined;
  readonly toastId?: Id | undefined;
};

type NormalizedAppToast = Required<Pick<AppToastInput, "type">> &
  Omit<AppToastInput, "message" | "type"> & {
    readonly title: ReactNode;
    readonly description?: ReactNode | undefined;
  };

const DEFAULT_TITLES: Record<string, string> = {
  success: "Done.",
  error: "Something needs attention.",
  warning: "Please check this.",
  info: "Heads up.",
  default: "Update.",
};

const css = (className: string): string => styles[className] ?? className;

const getToastKindClass = (type: TypeOptions): string => {
  if (type === "success") return css("success");
  if (type === "error") return css("error");
  if (type === "warning") return css("warning");
  if (type === "info") return css("info");
  return css("default");
};

const getToastIconClass = (type: TypeOptions): string => {
  if (type === "success") return css("successIcon");
  if (type === "error") return css("errorIcon");
  if (type === "warning") return css("warningIcon");
  if (type === "info") return css("infoIcon");
  return css("defaultIcon");
};

const getToastMessageText = (message: ReactNode): string | null => {
  if (typeof message === "string") return message;
  if (typeof message === "number") return String(message);
  if (!message || isValidElement(message) || Array.isArray(message)) return null;

  if (typeof message === "object") {
    const maybeMessage = (message as { readonly message?: unknown }).message;
    if (typeof maybeMessage === "string") return maybeMessage;
  }

  return null;
};

const ToastIcon = ({ type }: { readonly type: TypeOptions }) => {
  if (type === "success") return <CheckCircleIcon aria-hidden="true" />;
  if (type === "error") return <ExclamationCircleIcon aria-hidden="true" />;
  if (type === "warning")
    return <ExclamationTriangleIcon aria-hidden="true" />;
  return <InformationCircleIcon aria-hidden="true" />;
};

const normalizeAppToast = (input: AppToastInput): NormalizedAppToast => {
  if (input.title) {
    return {
      ...input,
      title: input.title,
      description: input.description ?? input.message,
    };
  }

  const messageText = input.message ? getToastMessageText(input.message) : null;

  const friendly =
    messageText !== null
      ? getFriendlyToastContent({
          message: messageText,
          type: input.type,
        })
      : null;

  return {
    ...input,
    title:
      friendly?.title ??
      (messageText !== null
        ? normalizeToastText(messageText)
        : DEFAULT_TITLES[input.type] ?? DEFAULT_TITLES["default"]!),
    description:
      input.description ??
      friendly?.description ??
      (messageText !== null ? undefined : input.message),
    details: input.details ?? friendly?.details,
  };
};

export const AppToastContent = ({ toast: input }: { toast: AppToastInput }) => {
  const toastContent = normalizeAppToast(input);
  const action = toastContent.action;

  return (
    <div className={css("toastContent")}>
      <span className={clsx(css("icon"), getToastIconClass(toastContent.type))}>
        <ToastIcon type={toastContent.type} />
      </span>
      <div className={css("text")}>
        <div className={css("title")}>{toastContent.title}</div>
        {toastContent.description && (
          <div className={css("description")}>{toastContent.description}</div>
        )}
        {toastContent.details && (
          <div className={css("details")}>{toastContent.details}</div>
        )}
        {action?.href && (
          <a
            className={css("action")}
            href={action.href}
            target={action.external ? "_blank" : undefined}
            rel={action.external ? "noopener noreferrer" : undefined}
          >
            {action.label}
          </a>
        )}
        {!action?.href && action?.onClick && (
          <button
            className={css("action")}
            type="button"
            onClick={action.onClick}
          >
            {action.label}
          </button>
        )}
      </div>
    </div>
  );
};

const AppToastCloseButton = ({
  closeToast,
}: {
  readonly closeToast?: ((event?: MouseEvent<HTMLElement>) => void) | undefined;
}) => (
  <button
    aria-label="Dismiss notification"
    className={css("closeButton")}
    type="button"
    onClick={closeToast}
  >
    <XMarkIcon aria-hidden="true" />
  </button>
);

export const showAppToast = (input: AppToastInput): Id => {
  const options = {
    position: "top-right",
    autoClose: input.autoClose ?? getToastAutoClose(input.type),
    hideProgressBar: false,
    draggable: false,
    closeOnClick: false,
    pauseOnHover: true,
    transition: Slide,
    theme: "dark",
    type: input.type,
    icon: false,
    className: clsx(css("toastShell"), getToastKindClass(input.type)),
    bodyClassName: css("toastBody"),
    progressClassName: css("toastProgress"),
    ...(input.toastId !== undefined ? { toastId: input.toastId } : {}),
  } satisfies ToastOptions;

  return toast(<AppToastContent toast={input} />, options);
};

export const showAppToasts = ({
  messages,
  type,
}: {
  readonly messages: readonly string[];
  readonly type: TypeOptions;
}) => {
  messages.forEach((message) => showAppToast({ message, type }));
};

export const AppToastContainer = (
  props: Readonly<Partial<ToastContainerProps>>
) => (
  <ToastContainer
    {...props}
    className={clsx(css("toastContainer"), props.className)}
    closeButton={<AppToastCloseButton />}
    limit={props.limit ?? 5}
    newestOnTop={props.newestOnTop ?? true}
    style={{ zIndex: 100000, ...props.style }}
  />
);
