export default function HistorialLoading() {
  return (
    <div className="p-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-slate-200 dark:bg-slate-700 animate-pulse"></div>
          <div>
            <div className="h-7 w-48 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mb-2"></div>
            <div className="h-4 w-64 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
          </div>
        </div>
        <div className="w-32 h-10 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse"></div>
      </div>

      {/* Filters skeleton */}
      <div className="neumorphic-card p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <div className="h-16 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse"></div>
          <div className="h-16 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse"></div>
          <div className="h-16 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse"></div>
          <div className="h-16 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse"></div>
        </div>
      </div>

      {/* Table skeleton */}
      <div className="neumorphic-card overflow-hidden">
        <div className="p-4 space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    </div>
  );
}
