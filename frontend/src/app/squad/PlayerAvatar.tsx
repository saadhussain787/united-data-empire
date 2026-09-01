'use client';

export default function PlayerAvatar({ name }: { photo?: string | null; name: string }) {
  // Get up to 2 initials
  const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  return (
    <div className="w-full h-full flex items-center justify-center bg-[#151A22] text-[#D4AF37] font-bold text-lg">
      {initials}
    </div>
  );
}
