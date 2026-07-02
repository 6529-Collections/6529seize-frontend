import { faTimesCircle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type {
  ButtonHTMLAttributes,
  ComponentPropsWithoutRef,
  ReactNode,
} from "react";
import styles from "./NextGenAdmin.module.scss";

const adminPrimaryButtonClassName =
  "tw-bg-[#267c93] tw-text-white hover:tw-bg-[#20697d]";

function adminClassName(
  ...classNames: (string | false | null | undefined)[]
): string {
  return classNames.filter(Boolean).join(" ");
}

type ColumnSpan = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

const xsColumnClasses: Record<ColumnSpan, string> = {
  1: "tw-w-1/12 tw-flex-none",
  2: "tw-w-1/6 tw-flex-none",
  3: "tw-w-1/4 tw-flex-none",
  4: "tw-w-1/3 tw-flex-none",
  5: "tw-w-5/12 tw-flex-none",
  6: "tw-w-1/2 tw-flex-none",
  7: "tw-w-7/12 tw-flex-none",
  8: "tw-w-2/3 tw-flex-none",
  9: "tw-w-3/4 tw-flex-none",
  10: "tw-w-5/6 tw-flex-none",
  11: "tw-w-11/12 tw-flex-none",
  12: "tw-w-full tw-flex-none",
};

const smColumnClasses: Record<ColumnSpan, string> = {
  1: "min-[576px]:tw-w-1/12 min-[576px]:tw-flex-none",
  2: "min-[576px]:tw-w-1/6 min-[576px]:tw-flex-none",
  3: "min-[576px]:tw-w-1/4 min-[576px]:tw-flex-none",
  4: "min-[576px]:tw-w-1/3 min-[576px]:tw-flex-none",
  5: "min-[576px]:tw-w-5/12 min-[576px]:tw-flex-none",
  6: "min-[576px]:tw-w-1/2 min-[576px]:tw-flex-none",
  7: "min-[576px]:tw-w-7/12 min-[576px]:tw-flex-none",
  8: "min-[576px]:tw-w-2/3 min-[576px]:tw-flex-none",
  9: "min-[576px]:tw-w-3/4 min-[576px]:tw-flex-none",
  10: "min-[576px]:tw-w-5/6 min-[576px]:tw-flex-none",
  11: "min-[576px]:tw-w-11/12 min-[576px]:tw-flex-none",
  12: "min-[576px]:tw-w-full min-[576px]:tw-flex-none",
};

const mdColumnClasses: Record<ColumnSpan, string> = {
  1: "md:tw-w-1/12 md:tw-flex-none",
  2: "md:tw-w-1/6 md:tw-flex-none",
  3: "md:tw-w-1/4 md:tw-flex-none",
  4: "md:tw-w-1/3 md:tw-flex-none",
  5: "md:tw-w-5/12 md:tw-flex-none",
  6: "md:tw-w-1/2 md:tw-flex-none",
  7: "md:tw-w-7/12 md:tw-flex-none",
  8: "md:tw-w-2/3 md:tw-flex-none",
  9: "md:tw-w-3/4 md:tw-flex-none",
  10: "md:tw-w-5/6 md:tw-flex-none",
  11: "md:tw-w-11/12 md:tw-flex-none",
  12: "md:tw-w-full md:tw-flex-none",
};

export function Container({
  children,
  className,
  fluid,
}: Readonly<{
  children: ReactNode;
  className?: string;
  fluid?: boolean;
}>) {
  return (
    <div
      className={adminClassName(
        fluid
          ? "tw-w-full tw-px-3"
          : "tw-mx-auto tw-w-full tw-max-w-[850px] tw-px-3 min-[1001px]:tw-max-w-[950px] min-[1200px]:tw-max-w-[1050px]",
        className
      )}
    >
      {children}
    </div>
  );
}

export function Row({
  children,
  className,
}: Readonly<{
  children: ReactNode;
  className?: string | undefined;
}>) {
  return (
    <div className={adminClassName("-tw-mx-3 tw-flex tw-flex-wrap", className)}>
      {children}
    </div>
  );
}

export function Col({
  children,
  className,
  xs,
  sm,
  md,
  onClick,
}: Readonly<{
  children: ReactNode;
  className?: string | undefined;
  xs?: ColumnSpan | undefined;
  sm?: ColumnSpan | undefined;
  md?: ColumnSpan | undefined;
  onClick?: (() => void) | undefined;
}>) {
  const colClassName = adminClassName(
    "tw-relative tw-block tw-w-full tw-min-w-0 tw-px-3",
    !xs && !sm && !md && "tw-flex-1",
    xs && xsColumnClasses[xs],
    sm && smColumnClasses[sm],
    md && mdColumnClasses[md],
    className
  );

  if (onClick) {
    return (
      <button
        className={adminClassName(
          "tw-m-0 tw-appearance-none tw-border-0 tw-bg-transparent tw-py-0 tw-text-left tw-text-inherit",
          colClassName
        )}
        onClick={onClick}
        type="button"
      >
        {children}
      </button>
    );
  }

  return <div className={colClassName}>{children}</div>;
}

export function Button({
  children,
  className,
  type = "button",
  ...props
}: Readonly<ButtonHTMLAttributes<HTMLButtonElement>>) {
  const hasColorClass = className
    ?.split(" ")
    .some((name) => /^(hover:)?tw-bg-/.test(name));

  return (
    <button
      {...props}
      type={type}
      className={adminClassName(
        "tw-inline-flex tw-items-center tw-justify-center",
        !hasColorClass && adminPrimaryButtonClassName,
        className
      )}
    >
      {children}
    </button>
  );
}

function FormRoot({
  children,
  className,
  ...props
}: Readonly<ComponentPropsWithoutRef<"form">>) {
  return (
    <form {...props} className={adminClassName("tw-w-full", className)}>
      {children}
    </form>
  );
}

function FormGroup({
  children,
  className,
}: Readonly<{
  children: ReactNode;
  className?: string | undefined;
}>) {
  return <div className={adminClassName(className)}>{children}</div>;
}

function FormLabel({
  children,
  className,
}: Readonly<{
  children: ReactNode;
  className?: string | undefined;
}>) {
  return (
    <label className={adminClassName("tw-mb-2 tw-inline-block", className)}>
      {children}
    </label>
  );
}

type FormControlProps =
  | (ComponentPropsWithoutRef<"input"> & { as?: undefined })
  | (ComponentPropsWithoutRef<"textarea"> & { as: "textarea" })
  | (ComponentPropsWithoutRef<"select"> & { as: "select" });

function FormControl({ as, className, ...props }: Readonly<FormControlProps>) {
  const controlClassName = adminClassName(
    "tw-block tw-w-full tw-rounded-none tw-border tw-border-iron-200 tw-bg-white tw-px-3 tw-py-1.5 tw-text-base tw-text-iron-800 tw-placeholder-iron-600 focus:tw-border-[#267c93] focus:tw-outline-none disabled:tw-cursor-not-allowed disabled:tw-bg-iron-100 disabled:tw-opacity-80",
    className
  );

  if (as === "textarea") {
    return (
      <textarea
        {...(props as ComponentPropsWithoutRef<"textarea">)}
        className={controlClassName}
      />
    );
  }

  if (as === "select") {
    return (
      <select
        {...(props as ComponentPropsWithoutRef<"select">)}
        className={controlClassName}
      />
    );
  }

  return (
    <input
      {...(props as ComponentPropsWithoutRef<"input">)}
      className={controlClassName}
    />
  );
}

function FormSelect({
  className,
  children,
  ...props
}: Readonly<ComponentPropsWithoutRef<"select">>) {
  return (
    <select
      {...props}
      className={adminClassName(
        "tw-block tw-w-full tw-rounded-none tw-border tw-border-iron-200 tw-bg-white tw-px-3 tw-py-1.5 tw-text-base tw-text-iron-800 focus:tw-border-iron-700 focus:tw-outline-none",
        className
      )}
    >
      {children}
    </select>
  );
}

function FormCheck({
  className,
  label,
  type = "checkbox",
  ...props
}: Readonly<ComponentPropsWithoutRef<"input"> & { label: ReactNode }>) {
  return (
    <label className="tw-inline-flex tw-items-center tw-gap-2">
      <input
        {...props}
        className={adminClassName(
          "tw-h-4 tw-w-4 tw-border-iron-350 tw-accent-[#267c93] focus:tw-ring-[#267c93]",
          className
        )}
        type={type}
      />
      <span>{label}</span>
    </label>
  );
}

export const Form = Object.assign(FormRoot, {
  Check: FormCheck,
  Control: FormControl,
  Group: FormGroup,
  Label: FormLabel,
  Select: FormSelect,
});

export function NextGenAdminHeadingRow(
  props: Readonly<{ title: string; close: () => void }>
) {
  return (
    <Row className="tw-pt-4">
      <Col className="tw-flex tw-items-center tw-justify-between">
        <h3 className="tw-text-base tw-font-bold tw-text-white md:tw-text-lg">
          <b>{props.title.toUpperCase()}</b>
        </h3>
        <FontAwesomeIcon
          className={styles["closeIcon"]}
          icon={faTimesCircle}
          onClick={() => {
            props.close();
          }}
        ></FontAwesomeIcon>
      </Col>
    </Row>
  );
}

export function NextGenCollectionIdFormGroup(
  props: Readonly<{
    collection_id: string;
    collection_ids?: string[] | undefined;
    onChange: (id: string) => void;
  }>
) {
  return (
    <Form.Group className="tw-mb-4">
      <Form.Label>Collection ID</Form.Label>
      <Form.Select
        className={`${styles["formInput"]}`}
        value={props.collection_id}
        onChange={(e) => {
          props.onChange(e.target.value);
        }}
      >
        <option value="" disabled>
          Select Collection
        </option>
        {props.collection_ids?.map((id) => (
          <option key={`collection-id-${id}`} value={id}>
            {id}
          </option>
        ))}
      </Form.Select>
    </Form.Group>
  );
}

export function NextGenAdminScriptsFormGroup(
  props: Readonly<{
    scripts: string[];
    setScripts: (scripts: string[]) => void;
  }>
) {
  return (
    <Form.Group className="tw-mb-4">
      <Form.Label>
        Scripts {props.scripts.length > 0 && `x${props.scripts.length}`}
      </Form.Label>
      <Form.Control
        as="textarea"
        rows={3}
        placeholder="...script - one line per entry"
        value={props.scripts.join("\n")}
        onChange={(e) => {
          if (e.target.value) {
            props.setScripts(e.target.value.split("\n"));
          } else {
            props.setScripts([]);
          }
        }}
      />
    </Form.Group>
  );
}

export function NextGenAdminTextFormGroup(
  props: Readonly<{
    title: string;
    value: string;
    setValue: (scripts: string) => void;
  }>
) {
  return (
    <Form.Group className="tw-mb-4">
      <Form.Label>{props.title}</Form.Label>
      <Form.Control
        type="text"
        placeholder={`...${props.title}`}
        value={props.value}
        onChange={(e: any) => props.setValue(e.target.value)}
      />
    </Form.Group>
  );
}

export function NextGenAdminStatusFormGroup(
  props: Readonly<{
    title: string;
    status: boolean | undefined;
    setStatus: (status: boolean) => void;
  }>
) {
  return (
    <Form.Group className="tw-mb-4">
      <Form.Label>{props.title}</Form.Label>
      <span className="tw-flex tw-items-center tw-gap-4">
        <Form.Check
          checked={props.status}
          type="radio"
          label="Active"
          name="statusRadio"
          onChange={() => {
            props.setStatus(true);
          }}
        />
        <Form.Check
          checked={props.status === false}
          type="radio"
          label="Inactive"
          name="statusRadio"
          onChange={() => {
            props.setStatus(false);
          }}
        />
      </span>
    </Form.Group>
  );
}
