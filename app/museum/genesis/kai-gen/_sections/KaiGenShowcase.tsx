import GenesisTokenShowcase from "@/components/museum-genesis/GenesisTokenShowcase";

/**
 * The ten showcase pairs of the /museum/genesis/kai-gen page as
 * genesis showcase descriptors
 * (`media|tokenLine|keyTraits|rarity|flags|caption` — grammar documented
 * in GenesisTokenShowcase). Extracted verbatim from the WP scrape and
 * round-trip-asserted against every captured attribute before the page
 * was rewritten to render through the shared module.
 */
const PAIRS: readonly string[] = [
  "aafuseor/kai_gen_609.mp4|Token: 609|Body Type: Kong;Head Type: Blob;Color Type: Rainbow|1/2048 RG;1/2048 ASR;3/2048 AR||The #1 rarity Kai-Gen was minted by the Museum.",
  "AkiAFwHn/kai_gen_444.mp4|Token: 444|Color Palette: Orangey;Body Type: Blob;Helicopter Count: 5|14/2048 RG;13/2048 ASR;33/2048 AR||An exotic sight, this hybrid Kong/Blob monster is in a Rainbow color palette.",
  "kyuL9Qur/kai_gen_746.mp4|Token: 746|Body Type: Kong;Color Palette: Wa!;Head Type: Zilla|18/2048 AR;39/2048 RG;40/2048 ASR||A pair of hot-vivid purple and yellow Kong monsters attack the town on a cloudy day.",
  "Po2s8tWA/kai_gen_237.mp4|Token: 237|Body Type: Kong;Shader Type: Rainbow Chrome;Head Type: Bird|71/2048 AR;288/2048 ASR;686/2048 RG||Hybrid Kong body and Bird head and a color-changing ‘Rainbow Chrome' shader trait.",
  "tHmK946P/kai_gen_114.mp4|Token: 114|Body Type: Zilla;Head Type: Bird;Eye Type: Kawaii|78/2048 RG;79/2048 ASR;108/2048 AR||An odd hybrid monster featuring a Bird head on a Zilla body, it is not to be messed with.",
  "8cj0VD1T/kai_gen_688.mp4|Token: 688|Body Type: Zilla;Head Type: Blob;Eye Type: Sus|122/2048 AR;202/2048 RG;218/2048 ASR||A Blob headed and Kong body monster roams the night alone.",
  "zLD7OxnT/kai_gen_681.mp4|Token: 681|Color Palette: Orangey;Eye Type: Snake;Helicopter Count: 6|377/2048 AR;459/2048 RG;586/2048 ASR||A squad of bright camo-colored bird monsters is out for carnage and destruction",
  "xeFJsuEA/kai_gen_110.mp4|Token: 110|Color Palette: Frog;Eye Type: Good Feels;Color Type: Base|402/2048 AR;745/2048 RG;847/2048 ASR||An amusing pair of frog-colored Bird monsters attack the city.",
  "747OPBoz/kai_gen_595.mp4|Token: 595|Color Palette: Orangey;Eye Type: Snake;City Type: Radiating Wave|502/2048 AR;698/2048 RG;989/2048 ASR||This color-shifted Kong monster looks extremely chill while devastating the city.",
  "qb1rsPtw/kai_gen_725.mp4|Token: 725|Eye Type: Snake;Helicopter Count: 5;Kaiju Type: Kong|513/2048 ASR;587/2048 AR;587/2048 AR||A zebra-striped Kong monster attacks just as the sun starts to set.",
];

export default function KaiGenShowcase() {
  return <GenesisTokenShowcase kind="video" pairs={PAIRS} />;
}
