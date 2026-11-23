import { Container } from "@/components/ui/container";

interface PageIntroProps {
  eyebrow: string;
  title: string;
  description?: string;
  children?: React.ReactNode;
}

/** Opening block for secondary pages. */
export function PageIntro({ eyebrow, title, description, children }: PageIntroProps) {
  return (
    <Container className="pt-14 pb-10 md:pt-20 md:pb-14 lg:pt-24">
      <p className="eyebrow text-accent">{eyebrow}</p>
      <h1 className="mt-4 max-w-3xl font-display text-display-xl font-medium text-balance">
        {title}
      </h1>
      {description ? (
        <p className="mt-5 max-w-xl text-base leading-relaxed text-pretty text-muted">
          {description}
        </p>
      ) : null}
      {children}
    </Container>
  );
}
