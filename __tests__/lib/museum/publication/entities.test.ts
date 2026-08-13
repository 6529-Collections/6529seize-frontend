import {
  buildMuseumSignedWaveStormDropUrl,
  isMuseumExternalProposalMediaUrl,
  isMuseumExternalProposalPresentationMedia,
  isMuseumExternalProposalTokenSourceUrl,
  isMuseumSignedWaveStormUrl,
  type MuseumCuratedAcquisition,
  type MuseumEntityKind,
  type MuseumEntityRelation,
  type MuseumExternalProposalPresentationMedia,
  type MuseumExhibition,
  type MuseumOrganization,
} from "@/lib/museum/publication";

describe("Museum publication entity contract", () => {
  it("reserves the IA entity vocabulary without making proposals or exhibitions entities", () => {
    const kinds = [
      "collection",
      "work",
      "artist",
      "organization",
      "project",
      "curated_acquisition",
      "acquisition_program",
      "research",
      "exhibition",
    ] satisfies readonly MuseumEntityKind[];

    expect(kinds).toContain("organization");
    expect(kinds).toContain("exhibition");
    expect(kinds).not.toContain("proposed_acquisition");
  });

  it("models peer acquisitions, programs, and typed relations", () => {
    const acquisition = {
      kind: "curated_acquisition",
      id: "keys-and-gates",
      slug: "keys-and-gates",
      title: "Keys and Gates",
      thesis: "Photography of access, control, and exit.",
      status: "selected_through_acquisition_program_acquisition_pending",
      statusAsOf: "2026-08-01T15:03:35Z",
      acquisitionMethod: "program_primary_mint_purchase",
      programId: "6529NM-AP-01",
      artistIds: ["gulyildiz"],
      organizationIds: [],
      projectIds: [],
      workIds: ["6529NM-AP-01-OUT-001"],
      accessionLotIds: [],
      sourceDocumentIds: ["keys-and-gates-program"],
      sourcePaths: ["records/programs/6529NM-AP-01/program.json"],
    } satisfies MuseumCuratedAcquisition;

    const organization = {
      kind: "organization",
      id: "magnum-photos",
      slug: "magnum-photos",
      preferredName: "Magnum Photos",
      projectIds: [],
      artworkIds: [],
      acquisitionIds: [],
      documentIds: [],
      sourcePaths: ["records/organizations/magnum-photos.json"],
    } satisfies MuseumOrganization;

    const relation = {
      id: "keys-and-gates-program-produces-acquisition",
      relation: "acquisition_program_produces_curated_acquisition",
      from: { id: "6529NM-AP-01", kind: "acquisition_program" },
      to: { id: acquisition.id, kind: "curated_acquisition" },
      sourcePath: "records/programs/6529NM-AP-01/program.json",
    } satisfies MuseumEntityRelation;

    expect(acquisition.status).toBe(
      "selected_through_acquisition_program_acquisition_pending"
    );
    expect(organization.kind).toBe("organization");
    expect(relation.to.id).toBe("keys-and-gates");
  });

  it("keeps external proposal presentation media signed, credited, and non-retained", () => {
    const media = {
      id: "conflict-at-its-edges-presentation",
      kind: "external_proposal_presentation",
      source: {
        kind: "signed_wave_storm",
        waveId: "5f207393-5418-4a75-8738-e40edb44a94d",
        dropId: "002bfa4f-8416-48bf-b35e-38f354f1a9f0",
        partId: 2,
        serial: null,
        publicationRecordId: "6529NM-PG-2026-001",
        contextEntityId: "6529NM-CA-2026-003",
        sourcePath:
          "records/proposed-gifts/6529NM-PG-2026-001/wave-publication-observation-2026-08-08.json",
        mediaRecordPath: "records/entities/6529NM-MED-0003.json",
        sourceCommit: "92429032013b9dfdb626ff6860e272191a89dfc4",
      },
      mediaUrl:
        "https://arweave.net/VE0zO2N1zVTsbEUHdUFazEgvuMbmVOi6OfaWfQOWkaM",
      mediaMimeType: "image/jpeg",
      sourceByteSize: 2_518_674,
      width: 1600,
      height: 1067,
      altText: "A proposed Magnum photograph.",
      credit: {
        creditLine: "© artist / Magnum Photos. All Rights Reserved.",
        sourcePath: "records/entities/6529NM-MED-0003.json",
      },
      rights: {
        status: "presentation_only",
        licenseLabel: "All Rights Reserved",
        licenseUrl: null,
      },
      download: "not_permitted",
      preservation: "not_retained",
      affordances: [
        "view",
        "thumbnail",
        "hero",
        "alt",
        "open_upstream_presentation",
      ],
    } satisfies MuseumExternalProposalPresentationMedia;

    expect(
      isMuseumSignedWaveStormUrl(
        "https://6529.io/waves/002bfa4f-8416-48bf-b35e-38f354e9a9f0"
      )
    ).toBe(true);
    expect(media.rights.status).toBe("presentation_only");
    expect(media.download).toBe("not_permitted");
    expect(media.preservation).toBe("not_retained");
    expect(isMuseumExternalProposalPresentationMedia(media)).toBe(true);
  });

  it("accepts each exact Arweave transaction media join", () => {
    const mediaUrls = [
      "https://arweave.net/VE0zO2N1zVTsbEUHdUFazEgvuMbmVOi6OfaWfQOWkaM",
      "https://arweave.net/r0bUW6Mtxq897pgig0V01Ad43S_Ldwv3tARjwmjrqpE",
      "https://arweave.net/vRmOcFJRTK84ILXp2Tkjz5KoS4iXXbMqki7rxhTYlr4",
      "https://arweave.net/zLifpzu3AQWqjg59nuy9jeRqHPA5o5-LpwwBqNRcD5o",
      "https://arweave.net/oz0t0DJj2BgFCux1WXskxisxvzV2KA0ukqaVbQ1Ckco",
    ] as const;
    const joins = mediaUrls.map((mediaUrl, index) => {
      const sourcePath = `records/entities/6529NM-MED-${String(index + 3).padStart(4, "0")}.json`;
      const media = {
        id: `conflict-at-its-edges-${index + 1}`,
        kind: "external_proposal_presentation",
        mediaUrl,
        mediaMimeType: "image/jpeg",
        sourceByteSize: 1_000_000 + index,
        width: 1600,
        height: 1067,
        altText: `Governed proposal photograph ${index + 1}.`,
        source: {
          kind: "signed_wave_storm",
          waveId: "5f207393-5418-4a75-8738-e40edb44a94d",
          dropId: "002bfa4f-8416-48bf-b35e-38f354e9a9f0",
          partId: index + 2,
          serial: null,
          publicationRecordId: "6529NM-PG-2026-001",
          contextEntityId: "6529NM-CA-2026-003",
          sourcePath:
            "records/proposed-gifts/6529NM-PG-2026-001/wave-publication-observation-2026-08-08.json",
          mediaRecordPath: sourcePath,
          sourceCommit: "92429032013b9dfdb626ff6860e272191a89dfc4",
        },
        credit: {
          creditLine: "© artist / Magnum Photos. All Rights Reserved.",
          sourcePath,
        },
        rights: {
          status: "presentation_only",
          licenseLabel: "All Rights Reserved",
          licenseUrl: null,
        },
        download: "not_permitted",
        preservation: "not_retained",
        affordances: [
          "view",
          "thumbnail",
          "hero",
          "alt",
          "open_upstream_presentation",
        ],
      } satisfies MuseumExternalProposalPresentationMedia;

      return media;
    });

    expect(
      joins.map((media) => isMuseumExternalProposalPresentationMedia(media))
    ).toEqual([true, true, true, true, true]);
  });

  it("rejects arbitrary Arweave paths and URL authority variants", () => {
    const transactionId = "A".repeat(43);
    const invalidUrls = [
      `https://arweave.net/${"A".repeat(42)}`,
      `https://arweave.net/${"A".repeat(44)}`,
      `https://arweave.net/${transactionId}/variant`,
      `https://arweave.net/${transactionId}/`,
      `https://arweave.net/${transactionId}?download=1`,
      `https://arweave.net/${transactionId}#fragment`,
      `http://arweave.net/${transactionId}`,
      `https://arweave.net:8443/${transactionId}`,
      `https://user:pass@arweave.net/${transactionId}`,
      `https://arweave.net.evil.example/${transactionId}`,
      "https://arweave.net/manifest.json",
    ];

    expect(
      invalidUrls.every((url) => !isMuseumExternalProposalTokenSourceUrl(url))
    ).toBe(true);
    expect(
      invalidUrls.every((url) => !isMuseumExternalProposalMediaUrl(url))
    ).toBe(true);
    expect(
      isMuseumExternalProposalTokenSourceUrl(
        `https://arweave.net/${transactionId}`
      )
    ).toBe(true);
  });

  it("accepts only the governed CloudFront presentation path", () => {
    const valid =
      "https://d3lqz0a4bldqgf.cloudfront.net/drops/author_7ee51a67-07b7-4c91-87ed-464c56446c43/d498d837-3331-4650-a30e-27ca18d53521/magnum-75-127.jpg";
    expect(isMuseumExternalProposalMediaUrl(valid)).toBe(true);
    const invalidUrls = [
      valid.replace("https://", "http://"),
      valid.replace("d3lqz0a4bldqgf.cloudfront.net", "media.6529.io"),
      valid.replace(
        "d3lqz0a4bldqgf.cloudfront.net",
        "user:pass@d3lqz0a4bldqgf.cloudfront.net"
      ),
      `${valid}?download=1`,
      `${valid}#fragment`,
      valid.replace("/drops/", "/other/"),
      valid.replace(".jpg", ".svg"),
      valid.replace(
        "d498d837-3331-4650-a30e-27ca18d53521",
        "d498d837-3331-4650-a30e-27ca18d53521/extra"
      ),
    ];
    expect(
      invalidUrls.every((url) => !isMuseumExternalProposalMediaUrl(url))
    ).toBe(true);
  });

  it("rejects mutable, non-canonical, or signed-URL query variants", () => {
    expect(
      isMuseumSignedWaveStormUrl(
        "https://6529.io/waves/002bfa4f-8416-48bf-b35e-38f354e9a9f0?download=1"
      )
    ).toBe(false);
    expect(
      isMuseumSignedWaveStormUrl(
        "https://6529.io/waves/002bfa4f-8416-48bf-b35e-38f354e9a9f0/"
      )
    ).toBe(false);
    expect(
      isMuseumSignedWaveStormUrl(
        "https://example.test/waves/002bfa4f-8416-48bf-b35e-38f354e9a9f0"
      )
    ).toBe(false);
    expect(isMuseumSignedWaveStormUrl("https://6529.io/waves/main")).toBe(
      false
    );
  });

  it("builds only the exact Wave proposal drop URL", () => {
    const waveId = "002bfa4f-8416-48bf-b35e-38f354f1a9f0";
    const dropId = "002bfa4f-8416-48bf-b35e-38f354e9a9f0";
    expect(buildMuseumSignedWaveStormDropUrl(waveId, dropId)).toBe(
      `https://6529.io/waves/${waveId}?drop=${dropId}`
    );
    expect(buildMuseumSignedWaveStormDropUrl(waveId, "not-a-drop")).toBeNull();
  });

  it("fails closed when the media/source join is not exact", () => {
    expect(
      isMuseumExternalProposalPresentationMedia({
        id: "broken",
        kind: "external_proposal_presentation",
        mediaUrl: "https://media.6529.io/museum/broken.jpg",
        mediaMimeType: "image/jpeg",
        sourceByteSize: 1,
        width: 100,
        height: 100,
        altText: "Broken join",
        source: {
          kind: "signed_wave_storm",
          waveId: "not-a-wave",
          dropId: "not-a-drop",
          serial: null,
          publicationRecordId: "not-a-publication",
          sourcePath: "records/broken.json",
          sourceCommit: "not-a-commit",
        },
        credit: { creditLine: "", sourcePath: "records/broken.json" },
        rights: {
          status: "presentation_only",
          licenseLabel: "All Rights Reserved",
          licenseUrl: null,
        },
        download: "not_permitted",
        preservation: "not_retained",
        affordances: [
          "view",
          "thumbnail",
          "hero",
          "alt",
          "open_upstream_presentation",
        ],
      })
    ).toBe(false);
  });

  it("reserves Exhibition as a typed record without requiring a publication instance", () => {
    const exhibition = {
      kind: "exhibition",
      id: "exhibition-example",
      slug: "exhibition-example",
      title: "Example Exhibition",
      status: "planned",
      workIds: [],
      sourceDocumentIds: [],
      sourcePaths: [],
    } satisfies MuseumExhibition;

    expect(exhibition.kind).toBe("exhibition");
    expect(exhibition.workIds).toEqual([]);
  });
});
