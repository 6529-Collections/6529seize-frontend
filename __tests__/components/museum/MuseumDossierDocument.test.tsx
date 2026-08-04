import { render, screen } from "@testing-library/react";
import { MuseumDossierDocument } from "@/components/museum/MuseumDossierDocument";

describe("MuseumDossierDocument", () => {
  afterEach(() => {
    window.history.replaceState(null, "", "/");
  });

  it("opens the dossier document targeted by the current fragment", () => {
    window.history.replaceState(null, "", "/#accession-certificate");
    render(
      <MuseumDossierDocument
        anchor="accession-certificate"
        summary={<summary>Accession certificate</summary>}
      >
        <p>Certificate body</p>
      </MuseumDossierDocument>
    );

    expect(
      screen.getByText("Accession certificate").closest("details")
    ).toHaveProperty("open", true);
  });

  it("keeps untargeted dossier documents closed", () => {
    window.history.replaceState(null, "", "/#another-document");
    render(
      <MuseumDossierDocument
        anchor="accession-certificate"
        summary={<summary>Accession certificate</summary>}
      >
        <p>Certificate body</p>
      </MuseumDossierDocument>
    );

    expect(
      screen.getByText("Accession certificate").closest("details")
    ).toHaveProperty("open", false);
  });
});
