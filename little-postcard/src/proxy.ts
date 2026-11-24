import { NextResponse, type NextRequest } from "next/server";
import { getContentRepository } from "@/lib/content";

/**
 * Real 404 status for postcards that do not exist or are not public.
 *
 * With Cache Components the page's prerendered shell starts a 200 response
 * before the page can check its slug, so `notFound()` alone yields the
 * right UI (plus noindex) but the wrong status. Proxy runs before
 * rendering; rewriting to an unmatched path renders app/not-found.tsx
 * with a 404. The page keeps its own notFound() as a second line.
 */
export async function proxy(request: NextRequest) {
  const slug = decodeURIComponent(request.nextUrl.pathname.split("/")[2] ?? "");
  const video = slug ? await (await getContentRepository()).getVideoBySlug(slug) : null;
  if (video) return NextResponse.next();
  return NextResponse.rewrite(new URL("/__postcard-not-found", request.url));
}

export const config = {
  matcher: "/postcard/:slug",
};
