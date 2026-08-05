# Public Museum proposition

[Network Museum documentation](README.md)

## Overview

The 6529 Network Museum presents itself as a public museum for a network state:
a permanent digital-art collection held by the 6529 Network on Ethereum,
governed through TDH, and open worldwide.

The homepage establishes that proposition once and then lets art, curation, and
collection access lead. The complete About page explains what Network holding
means, how the Museum operates today, what remains delegated, and how its
institutional record and custody are intended to move further on-chain.

## Location in the Site

- Museum homepage: `/museum/network`
- Full institutional proposition: `/museum/network/about`
- Permanent collection: `/museum/network/collection`
- Museum decisions: `/museum/network/governance`
- Stories and research: `/museum/network/stories`

## Entry Points

- Open `Museum` from the main 6529 navigation.
- Choose `How the Network Museum works` in the homepage hero.
- Choose `Read about the Network Museum` in the institutional module near the
  bottom of the homepage.
- Choose `About` in the Museum navigation from any Museum page.

## User Journey

1. The homepage opens with one institutional headline and a major accessioned
   artwork.
2. A compact line states that the Museum is held by the 6529 Network, governed
   through TDH, held on Ethereum, and open worldwide.
3. `Now on view` presents the seven accessioned Casey Reas works.
4. `Explore the collection` provides paths to all accessioned works, artists,
   and represented projects.
5. Quieter modules lead to Keys and Gates, stories and research, the full
   institutional proposition, and the public record.
6. The About page explains the Museum of the Network, its network-native
   structure, the current operating state, the next stage, and the permanence
   objective.

## Common Scenarios

### Understanding who holds the Museum

The Museum is described as held by the 6529 Network through a dedicated Museum
Safe. This is institutional holding, not fractional ownership. Individual
Network members do not receive shares or an economic claim on collection
assets.

### Understanding governance

The About page distinguishes major TDH-weighted collecting and policy decisions
from delegated editorial, registrar, technical, repository, and Safe execution
work. It does not describe the current institution as fully decentralized.

### Verifying the collection

The collection route shows accessioned Museum holdings. The Safe's wallet
inventory is not treated as the accession register, and selected Keys and Gates
works remain outside the permanent collection until their acquisition and
accession requirements are complete.

### Inspecting the public record

Homepage and About-page links lead to the Museum Safe, Museum decisions, the
public repository, and the exact institutional source documents used by the
current verified publication.

## Edge Cases

- A token appearing in the Museum Safe is not presented as accessioned unless
  it is also admitted to the collection register.
- Ethereum evidence is described as evidence of token identity, custody, and
  transactions. The site does not treat it as proof of legal title, copyright,
  artistic provenance, accession, or preservation.
- Public records are open to inspect, while donor privacy, personal data, legal
  files, and custody-security material may remain restricted.
- The permanence objective includes records, software, media, rights evidence,
  and replaceable interfaces; it does not claim that token ownership alone
  preserves an artwork or institution forever.

## Failure and Recovery

The homepage and About page fail closed if the complete verified Museum
publication is unavailable. Visitors see an unavailable-publication message
instead of a partial institutional claim or inferred record. When a last valid
source edition is available, the Museum shell identifies that source state and
keeps exact source and revision links visible.

## Limitations / Notes

- The current institutional record is maintained in the public repository; it
  is not yet a canonical on-chain Museum record.
- Museum Safe signers currently execute Ethereum transactions.
- The on-chain decision, custody, and execution system is a direction with
  explicit technical gates, not a deployed capability.
- Keys and Gates remains a program with selected, unminted works rather than an
  accessioned Museum holding.

## Related Pages

- [Network Museum documentation](README.md)
- [Institutional practice](feature-institutional-practice.md)
- [Navigation](../navigation/README.md)
- [Documentation home](../README.md)
