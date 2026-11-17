import { notFound } from "next/navigation";

// Catch unknown paths inside a locale so they render the localized 404 page.
export default function CatchAll() {
  notFound();
}
