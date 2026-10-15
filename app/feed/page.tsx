import { notFound } from "next/navigation";

// `/feed` was the address of the WordPress-era RSS feed, later redirected to
// `/index.xml`. The site publishes no feed there (or anywhere), so the
// redirect only led to another 404. Answer 404 directly instead.
export default function FeedPage(): never {
  notFound();
}
