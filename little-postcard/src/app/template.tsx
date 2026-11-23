/**
 * Re-mounts on every navigation, giving each page a short fade-and-rise
 * entrance (disabled under prefers-reduced-motion in globals.css).
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <main id="main" tabIndex={-1} className="flex-1 animate-page-in outline-none">
      {children}
    </main>
  );
}
