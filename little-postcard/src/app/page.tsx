import { CategoryExplorer } from "@/components/home/category-explorer";
import { ClosingStatement } from "@/components/home/closing-statement";
import { FeaturedPostcard } from "@/components/home/featured-postcard";
import { HeroSection } from "@/components/home/hero-section";
import { LatestPostcards } from "@/components/home/latest-postcards";
import { MoodExplorer } from "@/components/home/mood-explorer";
import { getContentRepository } from "@/lib/content";
import { countByCategory, countByMood, labelLookup } from "@/lib/content/stats";
import { routes } from "@/lib/routes";

const LATEST_LIMIT = 6;

export default async function HomePage() {
  const repo = await getContentRepository();
  const [featured, moods, categories, allVideos] = await Promise.all([
    repo.getFeaturedVideo(),
    repo.getMoods(),
    repo.getCategories(),
    repo.getVideos(),
  ]);
  const latest = await repo.getLatestVideos({
    limit: LATEST_LIMIT,
    excludeIds: featured ? [featured.id] : [],
  });

  const categoryLabel = labelLookup(categories);
  const newest = allVideos[0];

  return (
    <>
      <HeroSection latestHref={newest ? routes.postcard(newest.slug) : routes.library()} />
      {featured ? (
        <FeaturedPostcard
          video={featured}
          categoryLabel={categoryLabel(featured.category)}
          moods={moods}
        />
      ) : null}
      {latest.length > 0 ? <LatestPostcards videos={latest} categories={categories} /> : null}
      <MoodExplorer moods={moods} counts={countByMood(allVideos)} />
      <CategoryExplorer categories={categories} counts={countByCategory(allVideos)} />
      <ClosingStatement />
    </>
  );
}
