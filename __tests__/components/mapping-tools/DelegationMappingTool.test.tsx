import { render, fireEvent } from "@testing-library/react";
import DelegationMappingTool from "../../../components/mapping-tools/DelegationMappingTool";

jest.mock("react-bootstrap", () => ({
  Container: (props: any) => <div {...props} />,
  Row: (props: any) => <div {...props} />,
  Col: (props: any) => <div {...props} />,
  Form: {
    Select: (props: any) => <select {...props} />,
    Control: (props: any) => <input {...props} />,
  },
  Button: (props: any) => <button {...props} />,
}));

describe("DelegationMappingTool drag and drop", () => {
  it("toggles active class on drag events and shows file name on drop", () => {
    const { getByText } = render(<DelegationMappingTool />);
    const textElement = getByText(/drag and drop/i);
    const dropzone = textElement.parentElement as HTMLElement;

    expect(dropzone.className).not.toMatch(/uploadAreaActive/);
    fireEvent.dragEnter(dropzone);
    expect(dropzone.className).toMatch(/uploadAreaActive/);
    fireEvent.dragLeave(dropzone);
    expect(dropzone.className).not.toMatch(/uploadAreaActive/);

    const file = new File(["a"], "test.csv", { type: "text/csv" });
    fireEvent.drop(dropzone, { dataTransfer: { files: [file] } });
    expect(dropzone.textContent).toContain("test.csv");
  });

  it("clicking area triggers hidden file input", () => {
    const { getByText, container } = render(<DelegationMappingTool />);
    const textElement = getByText(/drag and drop/i);
    const dropzone = textElement.parentElement as HTMLElement;
    const input = container.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;
    const spy = jest.spyOn(input, "click");
    fireEvent.click(dropzone);
    expect(spy).toHaveBeenCalled();
  });
});

import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { fetchAllPages } from "../../../services/6529api";

jest.mock("../../../services/6529api", () => ({
  fetchAllPages: jest.fn(() => Promise.resolve([])),
}));
jest.mock("csv-parser", () => () => {
  const handlers: Record<string, any> = {};
  const obj = {
    on: (event: string, cb: any) => {
      handlers[event] = cb;
      return obj;
    },
    write: jest.fn(),
    end: () => handlers["end"] && handlers["end"](),
  };
  return obj;
});

class MockFileReader {
  result: any;
  onload: ((e: any) => void) | null = null;
  readAsText() {
    this.result = "";
    this.onload && this.onload({});
  }
}
Object.defineProperty(window, "FileReader", {
  writable: true,
  value: MockFileReader,
});

it("processes file on submit", async () => {
  process.env.API_ENDPOINT = "https://test.6529.io";
  render(<DelegationMappingTool />);
  const input = document.querySelector(
    'input[type="file"]'
  ) as HTMLInputElement;
  const file = new File(["a"], "test.csv", { type: "text/csv" });
  await userEvent.upload(input, file);
  const button = screen.getByRole("button", { name: /submit/i });
  await userEvent.click(button);
  expect(button).toHaveTextContent(/processing/i);
  await waitFor(() => expect(fetchAllPages).toHaveBeenCalled());
});
