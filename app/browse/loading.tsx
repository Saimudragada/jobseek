export default function BrowseLoading() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav placeholder */}
      <div className="border-b border-border bg-card">
        <div className="max-w-5xl mx-auto px-4 h-14" />
      </div>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Search bar skeleton */}
        <div className="mb-5 h-10 bg-muted rounded-lg animate-pulse" />

        {/* Filter pill skeletons */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-7 bg-muted rounded-full animate-pulse w-16" />
          ))}
        </div>

        {/* Job card grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-5 animate-pulse">
              <div className="h-4 bg-muted rounded w-3/4 mb-2" />
              <div className="h-3 bg-muted rounded w-1/2 mb-4" />
              <div className="flex gap-2 mb-4">
                <div className="h-5 bg-muted rounded-full w-16" />
                <div className="h-5 bg-muted rounded-full w-12" />
                <div className="h-5 bg-muted rounded-full w-20" />
              </div>
              <div className="h-7 bg-muted rounded w-28" />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
