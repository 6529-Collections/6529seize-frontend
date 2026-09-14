import type { CmsBlockV1 } from "@/lib/profile-cms/protocol/v1";
import { getString } from "../site-renderer/data";
import type { RendererContext } from "../site-renderer/types";
import { getApprovedRows, type ApprovedRow } from "./contract";
import { ApprovedLink } from "./links";
import styles from "./ProjectMockup.module.css";

type ProjectMockupProps = {
  readonly block: CmsBlockV1;
  readonly context: RendererContext;
};

/** Authored project illustrations remain ordinary editable text and record rows. */
export default function ProjectMockup({ block, context }: ProjectMockupProps) {
  return getString(block, "mockup_style") === "catalogue" ? (
    <Catalogue block={block} context={context} />
  ) : (
    <Planner block={block} context={context} />
  );
}

function Planner({ block, context }: ProjectMockupProps) {
  const rows = getApprovedRows(block);
  const title = getString(block, "title");
  const heading = getString(block, "mockup_heading");
  const projects = [
    ...new Set(rows.map((row) => row.label.split(" / ")[0] ?? row.label)),
  ];
  return (
    <div className={styles["mat"]} data-cms-project-mockup="planner">
      <div className={styles["planner"]}>
        <header className={styles["appBar"]}>
          <h2 className={styles["appName"]}>
            <span className={styles["appMark"]} aria-hidden="true">
              {title?.slice(0, 1)}
            </span>
            {title}
          </h2>
          <p>{getString(block, "mockup_kicker")}</p>
        </header>
        <div className={styles["workspace"]}>
          <div className={styles["rail"]} aria-hidden="true">
            {heading ? <p className={styles["railActive"]}>{heading}</p> : null}
            <div className={styles["railProjects"]}>
              {projects.map((project, index) => (
                <p key={`${project}-${index}`}>
                  <span className={styles["projectDot"]} />
                  {project}
                </p>
              ))}
            </div>
          </div>
          <div className={styles["taskPanel"]}>
            <div className={styles["taskHeading"]}>
              {heading ? <h3>{heading}</h3> : null}
              <p>{getString(block, "mockup_period")}</p>
            </div>
            <p className={styles["taskDescription"]}>
              {getString(block, "mockup_description")}
            </p>
            <ul className={styles["tasks"]}>
              {rows.map((row, index) => (
                <li key={`${row.label}-${index}`}>
                  <span className={styles["taskDot"]} aria-hidden="true" />
                  <span className={styles["taskLabel"]}>{row.label}</span>
                  <span className={styles["status"]}>
                    <RowValue row={row} context={context} />
                  </span>
                </li>
              ))}
            </ul>
            <footer className={styles["taskFooter"]}>
              {getString(block, "mockup_footer")}
            </footer>
          </div>
        </div>
      </div>
    </div>
  );
}

function Catalogue({ block, context }: ProjectMockupProps) {
  const rows = getApprovedRows(block);
  return (
    <div className={styles["mat"]} data-cms-project-mockup="catalogue">
      <div className={styles["catalogue"]}>
        <header className={styles["catalogueBar"]}>
          <p>{getString(block, "mockup_kicker")}</p>
          <p>{getString(block, "mockup_period")}</p>
        </header>
        <div className={styles["catalogueIntro"]}>
          <h2>{getString(block, "title")}</h2>
          {getString(block, "mockup_heading") ? (
            <h3>{getString(block, "mockup_heading")}</h3>
          ) : null}
          <p>{getString(block, "mockup_description")}</p>
        </div>
        <ul className={styles["books"]}>
          {rows.map((row, index) => (
            <li key={`${row.label}-${index}`}>
              <div className={styles["bookCover"]}>
                <h3>{row.label}</h3>
                <span className={styles["bookRule"]} aria-hidden="true" />
              </div>
              <p className={styles["bookNote"]}>
                <RowValue row={row} context={context} />
              </p>
            </li>
          ))}
        </ul>
        <footer className={styles["catalogueFooter"]}>
          {getString(block, "mockup_footer")}
        </footer>
      </div>
    </div>
  );
}

function RowValue({
  row,
  context,
}: {
  readonly row: ApprovedRow;
  readonly context: RendererContext;
}) {
  return row.page_id ? (
    <ApprovedLink context={context} pageId={row.page_id}>
      {row.value}
    </ApprovedLink>
  ) : (
    row.value
  );
}
