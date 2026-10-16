/**
 * Montserrat advance widths, for sizing SVG boxes around their text on the
 * server, where nothing can be measured. Measured once in Chromium with the
 * site font (canvas measureText at 1,000 px), in thousandths of an em, for
 * the weights the diagrams use. A character not in the table counts as the
 * widest Latin capital, so an estimate never comes out short.
 */
const CHARS =
  " !\"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~§²³·×é–—’…⁴⁵⁶₁₂→−≤";

const WIDTHS: Readonly<Record<400 | 500 | 600 | 700, readonly number[]>> = {
  400: [
    262, 260, 373, 696, 615, 829, 669, 202, 329, 329, 386, 575, 212, 382, 212,
    335, 662, 361, 568, 564, 661, 566, 609, 589, 638, 609, 212, 212, 575, 575,
    575, 567, 1033, 717, 754, 719, 826, 669, 633, 773, 813, 302, 501, 711, 589,
    955, 813, 839, 718, 839, 723, 615, 574, 792, 698, 1111, 656, 635, 651, 318,
    335, 318, 576, 500, 600, 590, 678, 563, 678, 604, 339, 685, 676, 269, 274,
    601, 269, 1061, 676, 627, 678, 678, 401, 488, 406, 672, 542, 879, 534, 542,
    511, 334, 294, 334, 575, 490, 430, 430, 252, 575, 604, 500, 1000, 212, 647,
    430, 430, 430, 430, 430, 600, 575, 575,
  ],
  500: [
    269, 268, 391, 703, 621, 843, 686, 210, 337, 338, 400, 582, 227, 383, 227,
    352, 667, 370, 574, 572, 669, 574, 617, 598, 644, 617, 227, 227, 582, 582,
    582, 573, 1034, 732, 757, 723, 826, 670, 635, 772, 812, 310, 513, 719, 594,
    955, 812, 840, 722, 840, 727, 621, 587, 791, 712, 1126, 673, 647, 657, 333,
    352, 333, 583, 500, 600, 598, 682, 571, 682, 612, 353, 690, 681, 279, 284,
    616, 279, 1057, 681, 635, 682, 682, 410, 501, 414, 677, 559, 899, 552, 559,
    521, 351, 299, 351, 582, 500, 430, 430, 267, 582, 612, 500, 1000, 227, 691,
    430, 430, 430, 430, 430, 600, 582, 582,
  ],
  600: [
    276, 278, 413, 711, 629, 860, 706, 220, 347, 348, 416, 590, 244, 385, 244,
    371, 673, 381, 582, 582, 679, 584, 627, 608, 652, 627, 244, 244, 590, 590,
    590, 581, 1034, 749, 761, 727, 826, 670, 637, 772, 810, 319, 527, 729, 599,
    955, 810, 842, 726, 842, 731, 629, 602, 789, 729, 1144, 693, 661, 663, 350,
    371, 350, 591, 500, 600, 607, 686, 581, 687, 622, 369, 694, 685, 289, 295,
    636, 289, 1053, 685, 645, 686, 686, 420, 515, 424, 681, 578, 919, 573, 578,
    532, 370, 303, 370, 590, 511, 430, 430, 284, 590, 622, 500, 1000, 244, 743,
    430, 430, 430, 430, 430, 600, 590, 590,
  ],
  700: [
    283, 289, 437, 720, 638, 877, 728, 230, 357, 358, 434, 599, 262, 386, 262,
    392, 679, 392, 590, 592, 689, 595, 637, 620, 660, 637, 262, 262, 599, 599,
    599, 589, 1035, 766, 765, 733, 826, 671, 639, 771, 808, 328, 541, 740, 604,
    955, 808, 844, 732, 844, 735, 638, 618, 788, 746, 1163, 714, 676, 671, 368,
    392, 368, 600, 500, 600, 617, 690, 591, 692, 631, 387, 700, 691, 301, 307,
    660, 301, 1049, 691, 655, 690, 690, 431, 531, 435, 687, 598, 937, 595, 598,
    543, 391, 309, 391, 599, 522, 430, 430, 302, 599, 631, 500, 1000, 262, 798,
    430, 430, 430, 430, 430, 600, 599, 599,
  ],
};

const FALLBACK = 1_111;

type SvgFontWeight = 400 | 500 | 600 | 700;

/** The width of `text` in SVG units at `size` units, in the site font. */
function svgTextWidth(
  text: string,
  size: number,
  weight: SvgFontWeight = 400
): number {
  const widths = WIDTHS[weight];
  let total = 0;
  for (const char of text) {
    const index = CHARS.indexOf(char);
    total += index === -1 ? FALLBACK : (widths[index] ?? FALLBACK);
  }
  return (total / 1000) * size;
}

/**
 * The width of a box that holds each of `lines` (text, size, weight) with
 * `padding` units on either side, rounded up to a whole unit.
 */
export function svgBoxWidth(
  lines: ReadonlyArray<readonly [string, number, SvgFontWeight?]>,
  padding: number
): number {
  const widest = Math.max(
    0,
    ...lines.map(([text, size, weight]) => svgTextWidth(text, size, weight))
  );
  return Math.ceil(widest + 2 * padding);
}
