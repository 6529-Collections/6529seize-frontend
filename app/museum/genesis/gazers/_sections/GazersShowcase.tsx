import GenesisTokenShowcase from "@/components/museum-genesis/GenesisTokenShowcase";

/**
 * The ten showcase pairs of the /museum/genesis/gazers page as
 * genesis showcase descriptors
 * (`media|tokenLine|keyTraits|rarity|flags|caption` — grammar documented
 * in GenesisTokenShowcase). Extracted verbatim from the WP scrape and
 * round-trip-asserted against every captured attribute before the page
 * was rewritten to render through the shared module.
 */
const PAIRS: readonly string[] = [
  "9VHqNI5X/s5_gazers_500.mp4|Token: 500|Color Theory Style: Sea of Tranquility;The Attainable: Intention;Sky Layer Max: 6|1/1000 RG;396/1000 AR;715/1000 ASR||The neon teal-blue outline of the circular moon makes this output.",
  "zOARe8Dx/s5_gazers_520.mp4|Token: 520|Pattern Stripe Avg: 5;Transfer Value: 3;Overlay Layers: 4|1/1000 AR;1/1000 ASR;521/1000 RG||This Gazer features an uncommon ‘square moon.' The #1 output by rarity.",
  "WLfZdIG4/s5_gazers_303.mp4|Token: 303|Pattern Style Tight: 10;Pattern Style Close: 5|3/1000 AR;304/1000 RG;512/1000 ASR||A relatively smaller circular moon atop layers of dark backgrounds.",
  "mug2EiOu/s5_gazers_581.mp4|Token: 581|Ambience Hue Spread: 70;Color Theory Value Weight: 25|7/1000 AR;526/1000 ASR;582/1000 RG|plain|Numerous washed-out colors on the central moon and the background.",
  "laXRonAq/s5_gazers_195.mp4|Token: 195|Variance: 9;Color Theory Style: Palette;Alpha Style: 4|196/1000 RG;397/1000 AR;379/1000 ASR||A tiny central moon, due to it having a ‘Moon Size' value of ‘1.'",
  "dceLBAjk/s5_gazers_318.mp4|Token: 318|Pattern Style Close: 3;Color Theory Ambience: Seed|16/1000 AR;230/1000 ASR;319/1000 RG|rabr|Vivid yellows, blues and greens whiz around the crescent shaped moon.",
  "ripsX1wm/s5_gazers_766.mp4|Token: 766|Pattern Style Tight: 1;Color Theory Ambience: Golds|17/1000 AR;117/1000 ASR;767/1000 RG|plain|An outstanding Gazers specimen showing off a fiery yellow/orange crescent centered moon",
  "aouaWuIj/s5_gazers_585.mp4|Token: 585|Origin Moon: Begin Digital Art Studio Software;Ambience Hue Spread: 9|185/1000 ASR;271/1000 AR;586/1000 RG||Highly abstract and complex colors float and morph within the central figure.",
  "DUTz9vb1/s5_gazers_878.mp4|Token: 878|Color Theory Ambience: Golds;Full @: Midnight|438/1000 AR;660/1000 ASR;879/1000 RG||A tiny circular moon is produced in this output, on top of layers of green.",
  "sAiosh6B/s5_gazers_899.mp4|Token: 899|Pattern Spacing Reset Freq: 7;Alpha Style: 1|802/1000 ASR;837/1000 AR;900/1000 RG||Strong blue and purple tones of the crescent moon contrast against the dark brown.",
];

export default function GazersShowcase() {
  return <GenesisTokenShowcase kind="video" pairs={PAIRS} />;
}
