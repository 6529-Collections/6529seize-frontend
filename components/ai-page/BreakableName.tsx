import { Fragment } from "react";

/**
 * A file name that wraps after a hyphen, underscore or dot, as
 * "6529-ai-0.1.0-rc.1-windows-x64-setup.exe" should, and not in the middle
 * of a word.
 */
export default function BreakableName({ name }: { readonly name: string }) {
  const parts = name.split(/(?<=[-_.])/);
  return (
    <>
      {parts.map((part, index) => (
        <Fragment key={`${String(index)}:${part}`}>
          {index > 0 && <wbr />}
          {part}
        </Fragment>
      ))}
    </>
  );
}
