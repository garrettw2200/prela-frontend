export function LoadingSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-7 w-48 bg-gray-200 rounded"></div>
        <div className="h-5 w-32 bg-gray-200 rounded"></div>
      </div>

      <div className="overflow-hidden rounded-lg bg-white shadow">
        <div className="bg-gray-50 px-6 py-3">
          <div className="flex gap-4">
            <div className="h-4 w-24 bg-gray-200 rounded"></div>
            <div className="h-4 w-32 bg-gray-200 rounded"></div>
            <div className="h-4 w-28 bg-gray-200 rounded"></div>
            <div className="h-4 w-24 bg-gray-200 rounded"></div>
            <div className="h-4 w-20 bg-gray-200 rounded"></div>
            <div className="h-4 w-16 bg-gray-200 rounded"></div>
            <div className="h-4 w-20 bg-gray-200 rounded"></div>
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="px-6 py-4">
              <div className="flex gap-4">
                <div className="h-5 w-40 bg-gray-200 rounded"></div>
                <div className="h-5 w-16 bg-gray-200 rounded"></div>
                <div className="h-5 w-20 bg-gray-200 rounded"></div>
                <div className="h-5 w-16 bg-gray-200 rounded"></div>
                <div className="h-5 w-32 bg-gray-200 rounded"></div>
                <div className="h-5 w-16 bg-gray-200 rounded"></div>
                <div className="h-5 w-24 bg-gray-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
