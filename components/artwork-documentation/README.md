# Reusing the artist record

`ArtworkDocumentationRecord` is the full artist editor for an existing documentation
context. The same component can be embedded during submission or on an existing
artwork page. It uses the context's server-supplied profile, permissions, project
terms and confirmed history. Keys and Gates is a consumer of the general record;
its photography suggestion and fixed artwork terms do not create a separate form.

```tsx
import ArtworkDocumentationRecord from "@/components/artwork-documentation/ArtworkDocumentationRecord";

<ArtworkDocumentationRecord
  context={authorizedContext}
  artworkInfo={{
    title: artwork.title,
    description: artwork.description,
    preferredCredit: artwork.artistCredit,
    tokenReferences: [{
      chain_namespace: "eip155",
      chain_id: artwork.chainId,
      contract_address: artwork.contractAddress,
      token_id: artwork.tokenId,
      token_standard: "erc721",
      relationship: "represents_work",
      source_url: artwork.sourceUrl,
    }],
  }}
  initialMediaProfiles={["photography"]}
/>
```

The caller obtains or creates an authorized context through the existing API.
`ArtworkDocumentationInlineStart` is the submission adapter: it creates that context
and then renders this shared component. A context must belong to the intended
artwork and owner; caller-supplied display information does not grant access.

`artworkInfo` accepts title, caption (or description), preferred credit, token
references and external catalogue identifiers. Suggestions initialize only empty,
editable answers. Existing answers, including explicit unknown or not-applicable
answers, are preserved. These inputs become draft answers subject to ordinary
validation and autosave. They do not confirm an artist statement, verify a token on
a blockchain, set project terms, fetch remote material or attach an original file.
New reference entries receive local identifiers if the caller has not supplied one.

The artist may combine all applicable media. `initialMediaProfiles` is an initial
suggestion filtered against the server catalogue; it does not lock later choices.
Project terms come from the trusted server context. The component keeps original
mutation permissions separate from broader reading permissions.

An optional ref exposes `flush()` and `onDropSubmitted(dropId)`. Flush before a
caller-owned step that depends on saved answers. After a successful submission,
`onDropSubmitted` associates the source with the existing context and returns
`{ linked, contextId, workId }`; a failed association can be retried against those
same identifiers. Do not create a replacement record to recover a failed link.
Remount with a context-specific React key when changing to a different artwork.

The embedded record keeps chapter navigation local. Draft reading, confirmation,
historical revisions, catalogue entries and dossier actions retain their existing
API boundaries. HTML and executable source remain downloadable material; only
server-authorized passive audio and video can use the native media player.
