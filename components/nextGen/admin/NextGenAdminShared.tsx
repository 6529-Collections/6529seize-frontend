import { faTimesCircle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type {
  ButtonHTMLAttributes,
  ComponentPropsWithoutRef,
  ReactNode,
} from "react";
import styles from "./NextGenAdmin.module.scss";

const legacyClassMap: Record<string, string> = {
  "align-items-center": "tw-items-center",
  "align-items-start": "tw-items-start",
  "btn-block": "tw-w-full",
  "btn-white": "tw-bg-white tw-text-black hover:tw-bg-[rgb(215,215,215)]",
  "d-flex": "tw-flex",
  "flex-column": "tw-flex-col",
  "flex-nowrap": "tw-flex-nowrap",
  "flex-wrap": "tw-flex-wrap",
  "font-color": "tw-text-white",
  "gap-1": "tw-gap-1",
  "gap-2": "tw-gap-2",
  "gap-3": "tw-gap-3",
  "gap-4": "tw-gap-4",
  "gap-5": "tw-gap-5",
  "justify-content-between": "tw-justify-between",
  "justify-content-center": "tw-justify-center",
  "justify-content-end": "tw-justify-end",
  "mb-0": "tw-mb-0",
  "mb-3": "tw-mb-3",
  "mt-3": "tw-mt-3",
  "mt-4": "tw-mt-4",
  "no-padding": "tw-px-0",
  "pb-2": "tw-pb-2",
  "pt-2": "tw-pt-2",
  "pt-3": "tw-pt-3",
  "pt-4": "tw-pt-4",
  "seize-btn":
    "tw-rounded-none tw-border-0 tw-px-5 tw-py-2 tw-font-bold disabled:tw-cursor-not-allowed disabled:tw-opacity-60",
  "text-center": "tw-text-center",
  "text-danger": "tw-text-error",
  "text-success": "tw-text-success",
  "w-100": "tw-w-full",
};

function adminClassName(
  ...classNames: (string | false | null | undefined)[]
): string {
  return classNames
    .flatMap((className) => className?.split(" ") ?? [])
    .filter(Boolean)
    .flatMap((className) => legacyClassMap[className]?.split(" ") ?? className)
    .join(" ");
}

type ColumnSpan = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

const xsColumnClasses: Record<ColumnSpan, string> = {
  1: "tw-w-1/12",
  2: "tw-w-1/6",
  3: "tw-w-1/4",
  4: "tw-w-1/3",
  5: "tw-w-5/12",
  6: "tw-w-1/2",
  7: "tw-w-7/12",
  8: "tw-w-2/3",
  9: "tw-w-3/4",
  10: "tw-w-5/6",
  11: "tw-w-11/12",
  12: "tw-w-full",
};

const smColumnClasses: Record<ColumnSpan, string> = {
  1: "sm:tw-w-1/12",
  2: "sm:tw-w-1/6",
  3: "sm:tw-w-1/4",
  4: "sm:tw-w-1/3",
  5: "sm:tw-w-5/12",
  6: "sm:tw-w-1/2",
  7: "sm:tw-w-7/12",
  8: "sm:tw-w-2/3",
  9: "sm:tw-w-3/4",
  10: "sm:tw-w-5/6",
  11: "sm:tw-w-11/12",
  12: "sm:tw-w-full",
};

const mdColumnClasses: Record<ColumnSpan, string> = {
  1: "md:tw-w-1/12",
  2: "md:tw-w-1/6",
  3: "md:tw-w-1/4",
  4: "md:tw-w-1/3",
  5: "md:tw-w-5/12",
  6: "md:tw-w-1/2",
  7: "md:tw-w-7/12",
  8: "md:tw-w-2/3",
  9: "md:tw-w-3/4",
  10: "md:tw-w-5/6",
  11: "md:tw-w-11/12",
  12: "md:tw-w-full",
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
        fluid ? "tw-w-full tw-px-3" : "tw-container tw-mx-auto tw-w-full tw-px-3",
        className
      )}>
      {children}
    </div>
  );
}

export function Row({
  children,
  className,
}: Readonly<{
  children: ReactNode;
  className?: string;
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
  className?: string;
  xs?: ColumnSpan;
  sm?: ColumnSpan;
  md?: ColumnSpan;
  onClick?: () => void;
}>) {
  return (
    <div
      className={adminClassName(
        "tw-relative tw-w-full tw-min-w-0 tw-px-3",
        !xs && !sm && !md && "tw-flex-1",
        xs && xsColumnClasses[xs],
        sm && smColumnClasses[sm],
        md && mdColumnClasses[md],
        className
      )}
      onClick={onClick}>
      {children}
    </div>
  );
}

export function Button({
  children,
  className,
  type = "button",
  ...props
}: Readonly<ButtonHTMLAttributes<HTMLButtonElement>>) {
  return (
    <button
      {...props}
      type={type}
      className={adminClassName(
        "tw-inline-flex tw-items-center tw-justify-center",
        className
      )}>
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
  className?: string;
}>) {
  return <div className={adminClassName(className)}>{children}</div>;
}

function FormLabel({
  children,
  className,
}: Readonly<{
  children: ReactNode;
  className?: string;
}>) {
  return (
    <label className={adminClassName("tw-mb-2 tw-inline-block", className)}>
      {children}
    </label>
  );
}

type FormControlProps = ComponentPropsWithoutRef<"input"> & {
  as?: "textarea";
  rows?: number;
};

function FormControl({
  as,
  className,
  ...props
}: Readonly<FormControlProps>) {
  const controlClassName = adminClassName(
    "tw-block tw-w-full tw-rounded-none tw-border tw-border-iron-400 tw-bg-white tw-px-3 tw-py-2 tw-text-base tw-text-iron-800 tw-placeholder-iron-500 focus:tw-border-[#267c93] focus:tw-outline-none disabled:tw-cursor-not-allowed disabled:tw-bg-iron-100 disabled:tw-opacity-80",
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

  return <input {...props} className={controlClassName} />;
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
        "tw-block tw-w-full tw-rounded-none tw-border tw-border-iron-400 tw-bg-white tw-px-3 tw-py-2 tw-text-base tw-text-iron-800 focus:tw-border-[#267c93] focus:tw-outline-none",
        className
      )}>
      {children}
    </select>
  );
}

function FormCheck({
  checked,
  label,
  name,
  onChange,
  type = "checkbox",
}: Readonly<
  Pick<
    ComponentPropsWithoutRef<"input">,
    "checked" | "name" | "onChange" | "type"
  > & { label: ReactNode }
>) {
  return (
    <label className="tw-inline-flex tw-items-center tw-gap-2">
      <input
        checked={checked}
        className="tw-h-4 tw-w-4 tw-border-iron-400 tw-text-primary-500 focus:tw-ring-primary-500"
        name={name}
        onChange={onChange}
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
    <Row className="pt-3">
      <Col className="d-flex align-items-center justify-content-between">
        <h3>
          <b>{props.title.toUpperCase()}</b>
        </h3>
        <FontAwesomeIcon
          className={styles["closeIcon"]}
          icon={faTimesCircle}
          onClick={() => {
            props.close();
          }}></FontAwesomeIcon>
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
    <Form.Group className="mb-3">
      <Form.Label>Collection ID</Form.Label>
      <Form.Select
        className={`${styles["formInput"]}`}
        value={props.collection_id}
        onChange={(e) => {
          props.onChange(e.target.value);
        }}>
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
    <Form.Group className="mb-3">
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
    <Form.Group className="mb-3">
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
    <Form.Group className="mb-3">
      <Form.Label>{props.title}</Form.Label>
      <span className="tw-flex tw-items-center tw-gap-3">
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
