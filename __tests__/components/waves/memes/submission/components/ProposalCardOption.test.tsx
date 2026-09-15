import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { ProposalCardOption } from "@/components/waves/memes/submission/components/ProposalCardOption";
import {
  createInitialState,
  formReducer,
} from "@/components/waves/memes/submission/hooks/artworkSubmissionFormState";
import type { ProposalCardLayout } from "@/lib/proposal-card/document";

function Option() {
  const [layout, setLayout] = useState<ProposalCardLayout | null>(null);
  return <ProposalCardOption layout={layout} onChange={setLayout} />;
}

it("starts off, offers both orientations, and removes the frame when unchecked", () => {
  render(<Option />);
  const checkbox = screen.getByRole("checkbox");
  expect(checkbox).not.toBeChecked();
  expect(screen.queryByRole("radio")).toBeNull();
  fireEvent.click(checkbox);
  expect(screen.getByRole("radio", { name: "Vertical" })).toBeChecked();
  fireEvent.click(screen.getByRole("radio", { name: "Horizontal" }));
  expect(screen.getByRole("radio", { name: "Horizontal" })).toBeChecked();
  fireEvent.click(checkbox);
  expect(checkbox).not.toBeChecked();
  expect(screen.queryByRole("radio")).toBeNull();
});

it("clears the frame when replacing supported artwork with a model", () => {
  const initial = createInitialState({});
  expect(initial.proposalFrame).toBeNull();
  const framed = formReducer(initial, {
    type: "SET_PROPOSAL_FRAME",
    payload: "landscape",
  });
  const state = formReducer(framed, {
    type: "SET_UPLOAD_MEDIA",
    payload: {
      file: new File(["glb"], "art.glb", { type: "model/gltf-binary" }),
      artworkUrl: "blob:model",
    },
  });
  expect(state.proposalFrame).toBeNull();
});
