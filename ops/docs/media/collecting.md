# Collecting Tools

## Overview

Collecting tools help you complete profile sets, collect selected NFTs, plan offers
and explore TDH. Browse individual artworks on The Memes, 6529 Gradient and NextGen
Pebbles collection pages, and review trades on the artwork's own page.
Collecting belongs to your profile: holdings across its confirmed consolidated
wallets count together.

## Location in the Site

- `/collect`: opens the set planner, with **Lowest listings** and **TDH** tools.
- `/collect/orders`: inspect trades, potential offers and transaction recovery.
- `/the-memes`, `/6529-gradient` and `/nextgen/collection/pebbles`: browse artwork
  and open individual cards.

## Entry Points

Open **Collect** in the NFT navigation, or choose **Complete my set** on
a collection page. The Memes carries the selected season into the planner, or
opens the full Memes set when no season is selected. Gradients opens the full
Gradients set; Pebbles opens its trait-set planner. Collected and Pebbles Trait
Sets also link to relevant collecting goals.

Supported artwork pages place a priced **Collect** action near the artwork summary,
before artwork details and [**Listings & offers**](feature-card-market-depth.md).
The actions appear in the order **Collect**, **Make an offer**, then **List**.
The lowest supported listing is selected automatically. **Deliver to · Change**
appears below Collect and lets you choose the receiving wallet; additional listings
remain available under **Other listings**. Collect checks the selected order again before showing exact
terms for wallet approval. A changed order requires another review.
**View listings & offers** selects the card's **Listings & offers** tab and moves
focus to the market. The price summary and order levels appear immediately,
without a second accordion. Switching tabs retains selections and active reviews.
Memes, Gradients and Pebbles use the same trading controls and review layout.
Memes and Meme Lab show traits, metadata and original files below the description
in **Overview**; existing `focus=the-art` links still reach that artwork information.

Listing prices load before you connect a wallet. While a price is unavailable,
the Collect area shows whether listings are loading, could not be loaded, or contain
no supported orders. **Connect wallet** remains available; connecting is required
before reviewing a purchase.

**Make an offer** is visible beside Collect. **List** appears when a
confirmed wallet in the profile holds the NFT. Connect that holding wallet to
list it; profile consolidation does not grant another wallet permission to sign.
Before connecting, **List** opens the wallet connection flow so ownership
can be checked.
The more-actions menu contains **Review offers**.
If ownership is still loading, **List** stays visible but unavailable.
If that check fails, choose **Try again** beside the action.

The **View The Memes**, **View Gradients** or **View Pebbles** link returns to the
current collection page. On narrow screens it appears as an arrow with the same
accessible name. The planner has no separate artwork search or browsing grid. Existing
links for browsing or a specific artwork open the corresponding collection or
card page.

## User Journey

1. Start in **Complete a set**, or choose **Lowest listings** or **TDH**.
   In the set planner, choose **Collection** first. The Memes offers **Full
   set**, **Season** and **Artist** under **Build toward**. Gradients opens its
   full set directly; Pebbles offers its named sets.
2. Connect your profile to inspect its holdings. Wallet controls describe where
   NFTs are held, which wallet pays or signs, and where a purchase is delivered.
3. Choose the season, artist or Pebbles set when applicable. Type a name in
   the selector to filter its options; artist names can be searched directly.
   Set **Copies per NFT** and, optionally, a **Budget cap (ETH, optional)**.
   Options show a loading state while the catalog arrives. If it cannot be
   loaded, choose **Try again**; a failed request does not mean the set is empty.
   Copies per NFT is the total you want to hold of each required NFT, including
   copies already in your profile.
   Leave the budget cap blank to estimate the full goal. An entered cap includes
   estimated gas. This is an analysis constraint; collecting still requires a fresh
   price review and wallet approval.
   Results appear below the controls. Missing requirements with available
   purchases come first, followed by requirements without priced availability, with
   the quantity priced for your goal, the proposed purchase quantity and its
   price. Artwork thumbnails and names link to their card pages. Compact estimates
   retain full amounts in accessible text and purchase review; rounding does not
   change the amounts used for review. **Already in your profile** expands the holdings that already meet
   the goal. The results show the purchase cost, gas reserve and projected
   profile completion before any purchase.
   With a budget cap, compare **Within your budget** and **Available for your
   goal**, calculated from the same listings. The budget option is selected
   initially. Choosing the available option explicitly removes that analysis
   cap for the review; its larger estimate is shown before continuing. Neither
   option guarantees complete market coverage. A partial plan leaves unfilled
   requirements visible; a missing price is never treated as zero cost.
4. Choose a strategy directly in the results: **Collect now**, **At WETH offer**,
   **WETH + %**, **Ask − %**, or **Blended**. The offer choices open the
   corresponding pricing controls. Proposed prices update automatically after
   selecting a method or editing its inputs; no initial calculation click is
   needed. Review the resulting individual NFT prices before continuing.
   With **Collect now**, select some or all proposed purchases. This brings them into
   one review with quantities, delivery addresses and an estimated total.
   **Review live total** checks every selected order and shows the exact price,
   fees and gas reserve before wallet approval. To propose your own prices,
   choose **Make offers** and review each NFT's offer separately.
5. Approve the required token permission if needed, then review and authorize
   the purchase transaction or fixed-price order signature in your wallet.
6. Follow the result in Orders. A sent transaction, a mined transaction and a
   confirmed result are separate states.

## Common Scenarios

### Review an individual purchase

The purchase summary shows the artwork and quantity, with separate **Pay with**
and **Deliver to** rows even when both use the same wallet. A confirmed profile
wallet name or an abbreviated address identifies each wallet. Click or tap its
row to reveal the full checksummed address and copy control. Check the destination
address before continuing, especially for a wallet outside your profile.

**Purchase price** includes the signed order fees. **Network fee cap** covers
the quoted purchase transaction and any required approvals. For an ETH purchase
with complete fee caps, **Maximum total** adds the price and those caps. Summary
caps round upward without changing the amounts submitted for approval.
If a cap is unavailable, the summary says **Not available yet** and does not show
a complete maximum. WETH prices and ETH network fees stay separate.

Open **Price breakdown** for seller proceeds and the fees already included in
the purchase price. Its nested **Exact amounts** shows the unrounded network fee
cap, approval fee caps and maximum where available. **Contract details** keeps
the NFT contract, exchange, fee recipients, approval scope and order identifiers
available separately. Known Ethereum addresses have names such as **The Memes**,
**6529 Gradient**, **NextGen**, **Seaport 1.6** and **OpenSea** for their applicable
roles. Expand a contract row for its full address, copy it or open its explorer
link. An unfamiliar address keeps a generic label; a display name does not replace
checking the exact address or grant permission to spend.

The review stays available while you read. **Continue in wallet** checks current
terms and refreshes the execution quote when needed. If the reviewed terms still
match, it proceeds to the wallet without a separate quote-refresh step. Changed
prices, fees, quantities, destinations, approval scopes or network fee caps require
you to review and continue again. The same checks apply to listings, offers,
accepting an offer, cancellation and supported multiple-item purchases. Checking
terms never signs or sends a transaction by itself. Quote freshness is separate
from the signed order's expiry; refreshing does not extend that order.

### Complete a profile set

Season, full-set, artist and Pebbles trait goals use the same profile-wide
scope. Holdings in two different confirmed wallets can satisfy complementary
requirements. Changing a custody filter does not change the collecting subject.
Pebbles supports Palette, Size, Traced and Ultimate; Ultimate can satisfy several
trait requirements with one token. Artist goals let you include collaborations.

### Compare available listings

Choose **Lowest listings**, then The Memes, Gradients or Pebbles. This tool shows
observed listings with prices and quantities, showing each NFT once at its lowest
supported purchase price. An indivisible lot says how many copies its price
includes. Open an artwork for its card page, or select its **+** to add it to
your purchase selection. The control becomes a checkmark; select it again to
remove that NFT. The selection stays available while switching between Lowest
listings and TDH, with its actions kept in view while you scroll.
**Review purchase** lets you collect some or all selected items;
**Plan offers** opens a price plan for those NFTs.
No listing results does not mean that no orders exist elsewhere. If the listing
source cannot be loaded, use **Try again** or return to the collection page.

### Collect for another wallet

**Deliver to** shows the selected destination compactly. Choose **Change** to
open the mint-style picker with your profile's confirmed wallets. Choose one,
or use **Send to a fren** to search a profile or ENS
name, or enter another wallet. Check the full resolved address before
authorization. The paying wallet is separate from the recipient. The NFT
is delivered directly to the chosen recipient in the purchase transaction.
There is no separate onward transfer. A Safe can receive a purchase from a
supported paying wallet.

A gift outside your profile is shown as a gift. It does not increase your
profile's projected completion or TDH. A multiple-item review starts with one
delivery address for the selection. You can change the destination of each NFT
and split an edition purchase across addresses. Each allocation must have a
valid address and the allocated quantities must equal the purchased quantity.

### Collect a selection together

Select NFTs from Lowest listings, TDH or a completion plan, then open
**Review purchase**. Select all or keep only the items you want, and check the
delivery addresses. The first total is an estimate; **Review live total**
requests current executable terms for every selected order.

Supported selections are purchased in one Ethereum transaction. Every selected
purchase and delivery succeeds together, or the transaction reverts. A revert
can still cost gas. The site does not silently replace an unavailable listing,
remove an item or split your purchase into several transactions. If the
selection cannot be bought together, edit it and review again.

The review shows each artwork's quantity and delivery allocations, the paying
wallet, purchase price, network fee cap and maximum where available. Price and
contract breakdowns preserve each order's exact fees and identity. **Continue in
wallet** rechecks every selected order together. A quote that aged while you read
is refreshed automatically; changed terms require another review. Changing the
selection, quantity, payer or delivery addresses also requires another review.
Orders retains the purchase until its receipt confirms all selected deliveries.

### Make or accept an offer

New offers specify exact NFTs, use WETH and receive NFTs in the signing wallet. A signature
can authorize a later fill while you are away. Required offer fees, listing
creator support, and the exact fees signed into existing orders are shown in
review. There is no additional 6529 platform fee.

Offer review reserves the full potential WETH exposure against other offers
prepared here. This reservation is conservative: it can exist even when the
site has not received a signature or confirmed publication. Other sites and
wallet activity can still change the available balance. Offers are not escrow.
Filling one offer can consume WETH allowance needed by another; review balances
and approval amounts before continuing with remaining offers.

On a supported artwork page, **Sell** or **Accept offer** can also use a
collection-wide offer or a trait offer whose eligibility can be verified. The
NFT on that page is the one being sold; no separate token choice is needed.
The site checks that NFT against the signed offer before opening review. An
unverified trait or unsupported order remains unavailable. The holding wallet
must sign, and sale proceeds go to that wallet.

### Choose an offer or listing expiry

Choose 1, 7 or 30 days, or **Custom…**. A custom expiry uses the
displayed local time zone and preserves the exact date and time you choose.
It must be at least five minutes away and within the supported 30-day window.
Invalid calendar dates and local times that are missing or repeated during a
daylight-saving change require another time. Refreshing a quote does not move
the order's expiry. An expired signed order cannot be extended by refreshing.

### Plan offers for selected NFTs

Select NFTs in Lowest listings or TDH, then choose **Plan offers**. A completion
plan also offers **Make offers**, including required NFTs that
have no supported listing. When several artworks could satisfy a trait, the
offer plan uses the chosen artworks rather than making offers on every
alternative.

**Enter each price** is the default. Set **WETH per NFT** for each artwork,
its quantity and a default expiry of 1, 7 or 30 days or a custom date and time. Open **Details & expiry**
to change an individual NFT's expiry. For editions, the unit price is
multiplied by the number of copies. A budget constrains an allocation; it does
not replace the individual NFT prices. Search the plan and select all or only
the NFTs you want to offer on.

Other **Price method** choices populate proposed prices automatically:

- **Match observed WETH offer** uses an applicable observed offer for that NFT.
- **Above observed WETH offer** adds your chosen percentage to that reference.
- **Below observed ask** subtracts your chosen percentage from the ask reference.
  Native ETH asks are compared with WETH at 1:1 before wrapping costs.
- **Conservative allocation** uses an **Offer budget (WETH)** and available
  reference evidence to propose opening prices. It can leave part of the budget
  unused; it does not predict acceptance or guarantee the best allocation.

An edited price is kept when recalculating. **Use calculated price** releases
that manual choice. Missing or stale references need a manual price or another
calculation; the site does not invent a price. Observed orders are references,
not confirmation that their makers are funded or that a seller will accept.

Choose **Check amounts and WETH** for manual prices. Calculated methods update
after their inputs change; **Refresh prices** requests another check. These
updates propose prices and never publish orders. Funding belongs to the paying wallet; WETH in other profile
wallets is not pooled. The check accounts for that wallet's potential offer
exposure. **Review offer** opens one NFT's exact quantity, price, fees and expiry
for wallet authorization. Quantity is fixed during this review; return to the
offer plan to change the number of copies. Each offer is signed separately and can fill
independently. Calculating prices does not publish offers, open the wallet or
automatically follow future bids.

Pending and published offers remain counted against the allocation budget while
you move back to collecting or change the selected NFTs in the same workspace.
**Awaiting offer status** is still a commitment; **Check offer status** reopens
that offer. Closing its review does not free its amount for another offer.
After a reload, enter a fresh budget and check funding again; the backend's
potential offer exposure still applies. Changing the profile or paying wallet
starts a separate workspace.

### Combine purchases and offers

Choose **Blended** in the completion results to decide how to acquire each NFT.
Choose **Conservative**, **Base** or **Aggressive**. Each NFT's own observed WETH
bid and exact listed cost determine its proposed price and whether to buy or
offer; Base is the initial choice.

- **Conservative** matches the observed bid and suggests buying when the gap is
  at most 2% of the listed cost. With only a listing, it proposes 70% of that cost.
- **Base** proposes one third of the way from bid to listed cost and suggests
  buying when the gap is at most 8%. With only a listing, it proposes 85%.
- **Aggressive** proposes two thirds of the way from bid to listed cost and
  suggests buying when the gap is at most 20%, or when only a listing is available.

With only a bid, each strategy matches it. Without usable references, enter a
price. Conflicting bid and listing prices need a refresh or manual choice.
For editions, proposals use the cost of the full requested quantity and round
the per-edition offer down. These are editable pricing defaults, not forecasts
of acceptance or investment value.

Manual prices and buy-or-offer choices stay yours when changing strategy.
Switch an NFT to **Collect now** when exact, priced listings cover its entire
requested quantity. Partial coverage does not silently reduce the requested
copies. If any selected purchase becomes unavailable, refresh it before reviewing
the selection; the site does not drop that NFT and purchase the rest.

The purchase summary shows ETH separately from the WETH offer budget. Generated
offer amounts receive a separate funding and budget check before **Review offer**
becomes available; your manual prices remain unchanged through that check.
Review the purchase rows together. These
are separate transactions and signatures; there is no combined budget guarantee
or all-or-revert guarantee across purchases and offers.

An NFT with a pending or published offer cannot also be routed into purchases in
this workspace. Opening purchase review reserves those NFTs from further offers
while that review is retained, including after closing it. That label does not
mean a purchase has been sent or confirmed. Use **Resume purchase review** to
return to the same selection. If you change the goal, scenario or destination,
**Resume prior plan review** explicitly returns to the original NFTs and address.
A new plan cannot replace that unfinished review. Before live transaction review
begins, **Discard purchase draft** releases its reservations. Confirmed settlement
also releases them; closing alone does not.

### Compare TDH

Choose **TDH** to see listings immediately, starting with The Memes. You do not
need a profile, budget or time horizon to browse. The grid compares each NFT's
best supported indexed ETH ask by **base TDH/day per ETH**. A higher value means
more base TDH accrual for the listed price. Signed listing fees are included;
gas and current availability are checked at purchase.

Holding time starts when you receive an NFT. The seller's accumulated TDH does
not transfer, and this comparison excludes profile and set multipliers. The
rate describes a full held day rather than a promise about tomorrow's snapshot.
For an indivisible lot, the displayed price and rate cover its exact quantity.

Open **How TDH value works** for the source snapshot and coverage. Indexed prices
can change, and a bounded comparison identifies when more indexed asks were
outside its coverage. The site checks a fresh executable quote before purchase.

### Link a daily TDH rate and purchase budget

In **TDH**, **Find your daily TDH** links **Base TDH per day** and
**Purchase budget (ETH)**. Edit either field and the other updates from indexed
listings after a short pause. The field you edited remains the target or cap;
the calculated field shows the result for the actual NFT quantities found.
Choose **Recalculate** to refresh the current target or budget without re-entering it.
Connect your profile to calculate and choose a delivery wallet within that profile.

The daily rate is the new NFTs' base earning rate per full held day, before
personal boosts. Listing fees are included in the purchase cost; gas is quoted
at review. Discrete NFTs can leave budget unused or overshoot a daily target.
A remaining shortfall stays visible. The search reports the best plan found
within its coverage, not a guaranteed global minimum.

Personal effects show the profile's boost and boosted daily rate before and
after the proposed purchase, separately from the base rate. The change to TDH
already accumulated by existing holdings is also separate: it is a stock
adjustment, not additional daily earnings. Changes retain their sign rather
than being presented as an automatic gain.

**Review purchase** uses the exact proposed NFTs. **Plan offers for these artworks**
is available when delivery matches the paying wallet. Offers require separate
signatures and add TDH only after they fill. Use **Reach target TDH** for a future
total on a particular date rather than a daily earning rate.

### Reach target TDH

From **TDH**, choose **Reach target TDH**. Enter the TDH you want to hold and a
timeframe of 1, 30, 90 or 365 days, then choose The Memes, Gradients or Pebbles.
The default is a total future TDH target, 30 days and The Memes.
**Back to TDH listings** returns to the immediate price comparison.

The projection uses your profile's confirmed consolidated holdings and a verified
official snapshot, including changes to bonuses on existing holdings.
**Deliver to** must be one of your profile's wallets: a gift outside the profile
adds no TDH to it. The paying wallet and delivery wallet can differ for a purchase.

Advanced options include **Additional TDH above my baseline**, measured above
the projected no-purchase baseline on the same future date.
**Maximum purchase budget (ETH)** is optional. Leave it blank to estimate the
purchase budget for the target. An entered limit includes signed listing fees
but excludes gas, which is quoted at purchase review. It does not authorize
spending.

Results compare the no-purchase baseline, proposed TDH and target on the shown
UTC date. **No purchases needed** means the baseline already meets the target.
Otherwise, the result shows the best purchase plan found, its exact NFTs and
quantities, and the estimated purchase subtotal. A closest plan keeps the
remaining TDH gap visible. This is a bounded search of indexed asks, not proof
of the global minimum cost or that an unmet target is impossible. Open the
assumptions for coverage and the snapshot used.

**Review purchase** opens those exact acquisitions in the shared purchase review.
Live prices, availability, gas and funding are checked there. Changing the NFTs,
quantities or delivery wallet requires a new projection before relying on its
TDH result. Changing the target, timeframe or profile also clears the old result.

**Plan offers for these artworks** opens individual offer prices for the proposed
NFTs. It requires the projected destination to be the paying wallet, because
offers deliver to their signer. If another profile wallet was selected, choose
the paying wallet and run the projection again first. Offers add TDH only after
they fill; a later fill leaves less holding time. The purchase projection does
not forecast when, or whether, those offers will fill.

### Save a rule for reviewed purchases

Save exact artwork targets from a plan with a fixed paying wallet, recipient,
unit-price ceilings, total review budget, gas reserve, expiry and action limit.
Rules prepare one ETH purchase at a time for your review and wallet approval.
Inspect them in Orders, where you can pause, resume and reconcile the outstanding
purchase. Pause and expiry retain unresolved operations. A page timeout is not
proof that a purchase was never sent.

Confirmed acquisitions count permanently toward the rule. Selling or moving
those NFTs later does not cause the rule to collect replacements. The limits apply
to this preparation workflow, not arbitrary external wallet transactions or an
on-chain autonomous mandate.

## Edge Cases

- Listing discovery is incomplete. No supported exact offer does not mean that
  no collection or trait offers exist elsewhere.
- A plan initially checks one best exact listing per artwork. Finishing that
  scan does not exhaust market depth. Additional copies may need other orders.
- A changed profile membership, catalog or recipient requires a fresh plan.
- Execution quote freshness does not expire an already signed offer. The order's
  own expiry and chain state determine its lifetime.
- ERC-721 approvals can be token-specific. ERC-1155 approval is collection-wide.
  The review identifies the actual spender and permission scope. WETH approvals
  use bounded amounts rather than default unlimited allowances.
- Accepting a WETH offer can require a bounded WETH allowance for its signed
  fees even when incoming proceeds fund those fees.

## Failure and Recovery

If the artwork cannot be loaded for trading, choose **Try again** in the dialog.
Loading, retry and review stay in the same dialog. **Close** or **Escape** returns
you to the card. Closing while it loads cancels that attempt; the review will
not open later when loading finishes.

If current terms differ when you continue, the review shows the changed terms
before requesting wallet approval. Review them and continue again if you accept
them. The site does not substitute a different NFT into an exact-item purchase.

Preparation errors distinguish an unreachable service, expired authentication,
changed profile or delivery wallets, unsupported terms and invalid trade details.
Follow the displayed recovery step; retrying preparation does not sign or send
a transaction. A failed offer preparation does not require choosing a listing.

If publication is uncertain, the order may still be usable. Keep its potential
exposure until confirmed cancellation, expiry or fill. If broadcast is uncertain,
retain the transaction hash and retry reconciliation of that same transaction.
Do not send another purchase merely because a page timed out.

If the wallet may have submitted a transaction without returning its hash, the
review changes to **Checking the outcome**. That operation cannot send another
transaction, including from another browser, while the attempt is unresolved.
Open your wallet's activity, copy the hash into **Transaction hash from your
wallet**, and select **Check this transaction**. The site verifies the exact
sender, NFT action and transaction details before accepting it. This also works
for an approval and when local browser recovery data is unavailable. A hash
that cannot yet be verified remains available for another check; checking it
does not send a replacement transaction. A failed recovery check shows an error
while retaining the unresolved transaction for another attempt.

Orders created here retain their original terms for direct on-chain cancellation
even when the marketplace provider is unavailable. Cancellation costs gas and
can lose a race to a fill. Pausing new trading or revoking an approval does not
permanently cancel an already signed order; reapproval can make it fillable again.

If a wallet moves to another profile, connect that original signing wallet to
recover its earlier orders and transaction hashes. Historical orders identify
their original profile. Start a fresh review in the current profile before
preparing another purchase or signature.

## Limitations / Notes

Trading uses Ethereum mainnet and supported OpenSea Seaport orders. ETH and WETH
are identified by their chain and contract, and exact amounts are preserved.
Execution from smart contract wallets and inside the native app is unavailable
until those execution paths are supported. Mobile web can use a supported wallet.
Profile consolidation and social proxy access do not authorize another wallet
to trade your assets.

Automatic wallet execution is not available. Programmatic preparation still
requires the owner to review and authorize each purchase or order. Signed limit
orders can be filled by others until effective cancellation or expiry.
Multiple-order purchases require supported exact ETH listings and a successful
simulation of the whole selection. These controls do not create collection-wide
or trait-group offers. A plan of individual offers has separate signatures and
fills; it does not have the all-or-revert guarantee of a supported purchase
selection.

## Related Pages

- [Media](README.md)
- [NFT actions](nft/README.md)
- [NextGen](../nextgen/README.md)
- [Profiles](../profiles/README.md)
- [API tools](../api-tool/README.md)
