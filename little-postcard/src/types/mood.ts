export interface Mood {
  id: string;
  /** URL-safe identifier used in /library?mood=… */
  slug: string;
  label: string;
  /** One short line shown under the mood name. */
  description: string;
}
