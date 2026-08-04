export default function DashboardLoading() {
  return (
    <div className="space-y-6 pb-12 animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="h-8 w-48 bg-dark/8 rounded-xl" />
          <div className="h-4 w-72 bg-dark/5 rounded-lg" />
        </div>
        <div className="h-10 w-32 bg-dark/8 rounded-full" />
      </div>

      {/* Stats grid skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="card p-5 flex items-start gap-4">
            <div className="h-11 w-11 rounded-xl bg-dark/6 shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3.5 w-24 bg-dark/6 rounded" />
              <div className="h-8 w-16 bg-dark/8 rounded-lg" />
              <div className="h-3 w-28 bg-dark/5 rounded" />
            </div>
          </div>
        ))}
      </div>

      {/* Content skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card p-0 overflow-hidden">
          <div className="px-5 py-4 border-b border-dark/8">
            <div className="h-5 w-40 bg-dark/8 rounded" />
          </div>
          <div className="p-5 space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-dark/6 shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3.5 w-32 bg-dark/8 rounded" />
                  <div className="h-3 w-48 bg-dark/5 rounded" />
                </div>
                <div className="h-5 w-14 bg-dark/5 rounded-full" />
              </div>
            ))}
          </div>
        </div>
        <div className="card p-0 overflow-hidden">
          <div className="px-5 py-4 border-b border-dark/8">
            <div className="h-5 w-32 bg-dark/8 rounded" />
          </div>
          <div className="p-3 space-y-1">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-12 bg-dark/4 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
