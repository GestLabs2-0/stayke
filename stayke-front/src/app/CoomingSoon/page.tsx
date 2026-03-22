const CoomingSoon = () => {
  return (
    <div className="xs:pt-10 md:pt-25 xl:pt-50 bg-background flex flex-col items-center justify-center px-6 text-center">
      {/* Badge */}
      <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-muted/30 px-4 py-1.5 text-xs text-muted-foreground">
        <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
        Work in progress
      </div>

      {/* Heading */}
      <h1 className="font-display text-4xl font-bold text-foreground sm:text-5xl lg:text-6xl leading-tight">
        This page is <span className="text-gradient">still being</span>
        <br />
        <span className="text-gradient">built</span> for you
      </h1>

      <p className="mt-6 max-w-md text-base text-muted-foreground sm:text-lg">
        We're working hard to bring this to life.{" "}
        <span className="text-foreground font-medium">Stay tuned</span> —
        something <span className="text-foreground font-medium">great</span> is
        coming.
      </p>

      {/* Back button */}
      <a
        href="/"
        className="mt-10 inline-flex items-center gap-2 gradient-solana rounded-xl px-6 py-3 text-sm font-semibold text-primary-foreground shadow-glow transition-opacity hover:opacity-90"
      >
        ← Back to Home
      </a>
    </div>
  );
};

export default CoomingSoon;
