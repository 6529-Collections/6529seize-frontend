import { Form } from "react-bootstrap";

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
