import "server-only";
import type { ContentRepository, ContentSource } from "./repository";

export type { ContentRepository, ContentSource } from "./repository";

/**
 * Picks the content source from CONTENT_SOURCE ("mock" | "supabase").
 *
 * Guard against mock data reaching production: when CONTENT_SOURCE is
 * unset, `next dev` uses mock data, but a production build or server
 * throws rather than silently serving the development fixtures.
 */
function resolveSource(): ContentSource {
  const configured = process.env.CONTENT_SOURCE;
  if (configured === "mock" || configured === "supabase") return configured;
  if (configured) {
    throw new Error(`Unknown CONTENT_SOURCE "${configured}". Use "mock" or "supabase".`);
  }
  if (process.env.NODE_ENV === "development") return "mock";
  throw new Error(
    'CONTENT_SOURCE is not set. Set CONTENT_SOURCE=supabase for production, or CONTENT_SOURCE=mock to build a preview with development data (npm run build:preview).',
  );
}

let repository: Promise<ContentRepository> | undefined;

export function getContentRepository(): Promise<ContentRepository> {
  repository ??= (async () => {
    if (resolveSource() === "supabase") {
      const [{ createSupabaseServerClient }, { createSupabaseRepository }] =
        await Promise.all([
          import("@/lib/supabase/server"),
          import("./supabase-repository"),
        ]);
      return createSupabaseRepository(createSupabaseServerClient());
    }
    const { createMockRepository } = await import("./mock-repository");
    return createMockRepository();
  })();
  return repository;
}
