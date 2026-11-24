import { CategoryExplorer } from "@/components/home/category-explorer";
import { ClosingStatement } from "@/components/home/closing-statement";
import { FeaturedPostcard } from "@/components/home/featured-postcard";
import { HeroSection } from "@/components/home/hero-section";
import { LatestPostcards } from "@/components/home/latest-postcards";
import { MoodExplorer } from "@/components/home/mood-explorer";
import { getContentRepository } from "@/lib/content";
import { routes } from "@/lib/routes";
import { countBy } from "@/lib/video-query";

const LATEST_LIMIT = 6;

export default async function HomePage() {
  const repo = await getContentRepository();
  const [featured, moods, categories, publicVideos] = await Promise.all([
    repo.getFeaturedVideo(),
    repo.getMoods(),
    repo.getCategories(),
    repo.getPublicVideos(),
  ]);
  const latest = await repo.getLatestVideos({
    limit: LATEST_LIMIT,
    excludeIds: featured ? [featured.id] : [],
  });

  const newest = publicVideos[0];
  const featuredCategory = categories.find((c) => c.id === featured?.categoryId);

  return (
    <>
      <HeroSection latestHref={newest ? routes.postcard(newest.slug) : routes.library()} />
      {featured ? (
        <FeaturedPostcard
          video={featured}
          categoryLabel={featuredCategory?.label ?? ""}
          moods={moods}
        />
      ) : null}
      {latest.length > 0 ? <LatestPostcards videos={latest} categories={categories} /> : null}
      <MoodExplorer moods={moods} counts={countBy(publicVideos, (v) => v.moodIds)} />
      <CategoryExplorer
        categories={categories}
        counts={countBy(publicVideos, (v) => [v.categoryId])}
      />
      <ClosingStatement />
    </>
  );
}
