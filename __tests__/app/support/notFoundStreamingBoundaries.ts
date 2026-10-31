import fs from "node:fs";
import path from "node:path";

export const APP_ROOT = path.join(process.cwd(), "app");

// A segment `loading.tsx` or a layout `<Suspense>` above a page streams the
// shell first and commits a 200 status before `notFound()` can run. Detail
// routes that must answer unknown ids with a real 404 therefore need an
// existence check that no streaming boundary sits above.
function ancestorDirectories(route: string): string[] {
  const segments = route.split("/");
  return [
    "",
    ...segments.map((_, index) => segments.slice(0, index + 1).join("/")),
  ];
}

export function findStreamingBoundaries(route: string): string[] {
  const boundaries: string[] = [];
  for (const directory of ancestorDirectories(route)) {
    const absolute = path.join(APP_ROOT, directory);
    if (fs.existsSync(path.join(absolute, "loading.tsx"))) {
      boundaries.push(path.posix.join("app", directory, "loading.tsx"));
    }
    for (const file of ["layout.tsx", "template.tsx"]) {
      const filePath = path.join(absolute, file);
      if (
        fs.existsSync(filePath) &&
        /<Suspense[\s>]/u.test(fs.readFileSync(filePath, "utf8"))
      ) {
        boundaries.push(path.posix.join("app", directory, file));
      }
    }
  }
  return boundaries;
}
