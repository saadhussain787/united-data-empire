export default function TransfersLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
      {/* Header Skeleton */}
      <div className="mb-12">
        <div className="h-10 w-64 bg-white/5 rounded-lg mb-2"></div>
        <div className="h-4 w-96 bg-white/5 rounded-lg mt-4"></div>
      </div>

      {/* Macro Dashboard Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-[#0d0e14] border border-white/10 rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-20">
              <div className="w-8 h-8 rounded-full bg-white/10"></div>
            </div>
            <div className="h-3 w-24 bg-white/5 rounded-full mb-4 uppercase tracking-widest"></div>
            <div className="h-10 w-40 bg-white/5 rounded-lg mb-2"></div>
            <div className="h-4 w-32 bg-white/5 rounded-lg mt-4"></div>
          </div>
        ))}
      </div>

      {/* Main Table Skeleton */}
      <div className="bg-[#0d0e14] border border-white/10 rounded-2xl overflow-hidden mt-12 p-8">
        <div className="h-8 w-48 bg-white/5 rounded-lg mb-6"></div>
        <div className="w-full h-[500px] bg-white/5 rounded-xl border border-white/5"></div>
      </div>
    </div>
  );
}
