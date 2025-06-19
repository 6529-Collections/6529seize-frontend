import { fetchFileContent } from "@/helpers/Helpers";

export async function fetchAboutSectionFile(section: string): Promise<string> {
  return await fetchFileContent(
    `https://6529bucket.s3.eu-west-1.amazonaws.com/seize_html/about/${section}.html`
  );
}
