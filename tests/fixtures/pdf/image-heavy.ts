import { deflateSync } from "node:zlib";

// Distinct page images expose retained decoded-image memory without committing
// a large binary fixture. Each page decodes to a 1024 x 1536 RGB raster.
export function createImageHeavyPdf(pageCount = 60): Buffer {
  const objects: Buffer[] = [];
  const add = (value: string | Buffer) => objects.push(Buffer.from(value));
  const stream = (dictionary: string, data: Buffer) =>
    Buffer.concat([
      Buffer.from(`<< ${dictionary} /Length ${data.length} >>\nstream\n`),
      data,
      Buffer.from("\nendstream"),
    ]);
  add("<< /Type /Catalog /Pages 2 0 R >>");
  const children = Array.from(
    { length: pageCount },
    (_, index) => `${4 + index * 3} 0 R`
  ).join(" ");
  add(`<< /Type /Pages /Kids [${children}] /Count ${pageCount} >>`);
  add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  const pixels = Buffer.alloc(1024 * 1536 * 3);
  for (let offset = 0; offset < pixels.length; offset += 1) {
    pixels[offset] = (offset * 17 + Math.floor(offset / 3072) * 13) % 256;
  }
  for (let page = 1; page <= pageCount; page += 1) {
    const id = objects.length + 1;
    add(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 512 800] ` +
        `/Resources << /Font << /F1 3 0 R >> /XObject << /Scan ${id + 2} 0 R >> >> ` +
        `/Contents ${id + 1} 0 R >>`
    );
    add(
      stream(
        "",
        Buffer.from(
          `q 512 0 0 768 0 0 cm /Scan Do Q\nBT /F1 18 Tf 20 778 Td (Raster page ${page}) Tj ET`
        )
      )
    );
    pixels[0] = page;
    add(
      stream(
        "/Type /XObject /Subtype /Image /Width 1024 /Height 1536 " +
          "/ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /FlateDecode",
        deflateSync(pixels)
      )
    );
  }
  const parts = [Buffer.from("%PDF-1.7\n")];
  const offsets = [0];
  let length = parts[0]!.length;
  objects.forEach((object, index) => {
    offsets.push(length);
    const part = Buffer.concat([
      Buffer.from(`${index + 1} 0 obj\n`),
      object,
      Buffer.from("\nendobj\n"),
    ]);
    parts.push(part);
    length += part.length;
  });
  const entries = offsets
    .slice(1)
    .map((offset) => `${String(offset).padStart(10, "0")} 00000 n \n`)
    .join("");
  parts.push(
    Buffer.from(
      `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${entries}` +
        `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${length}\n%%EOF`
    )
  );
  return Buffer.concat(parts);
}
