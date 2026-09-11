export default function ManagerLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
      {/* Dossier Header Skeleton */}
      <div className="mb-12">
        <div className="h-4 w-48 bg-white/5 rounded-lg mb-4"></div>
        <div className="h-12 w-80 bg-white/5 rounded-lg"></div>
      </div>

      {/* Main Dossier Card Skeleton */}
      <div className="bg-[#0d0e14] border border-white/10 rounded-2xl p-6 md:p-8 mb-12">
        <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">
          {/* Avatar Skeleton */}
          <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl bg-white/5 border border-white/10"></div>
          
          {/* Info Skeleton */}
          <div className="flex-1 space-y-4">
            <div className="h-8 w-64 bg-white/5 rounded-lg"></div>
            <div className="h-4 w-40 bg-white/5 rounded-lg"></div>
            
            {/* Stats Grid Skeleton */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-white/10">
              {[1, 2, 3, 4].map((i) => (
                <div key={i}>
                  <div className="h-3 w-16 bg-white/5 rounded-full mb-2"></div>
                  <div className="h-6 w-24 bg-white/5 rounded-lg"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Skeleton */}
      <div className="flex gap-8 mb-6 border-b border-white/10 pb-4">
        <div className="h-4 w-48 bg-white/5 rounded-full"></div>
        <div className="h-4 w-48 bg-white/5 rounded-full"></div>
      </div>

      {/* Table Skeleton */}
      <div className="bg-[#0d0e14] border border-white/10 rounded-2xl p-8">
        <div className="h-8 w-48 bg-white/5 rounded-lg mb-6"></div>
        <div className="w-full h-64 bg-white/5 rounded-xl border border-white/5"></div>
      </div>
    </div>
  );
}
