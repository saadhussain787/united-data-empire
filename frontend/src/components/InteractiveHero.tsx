'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Bebas_Neue, Inter, Teko } from 'next/font/google';

const bebas = Bebas_Neue({ weight: '400', subsets: ['latin'] });
const inter = Inter({ subsets: ['latin'] });
const teko = Teko({ weight: ['600', '700'], subsets: ['latin'] });

export default function InteractiveHero() {
  const [hoverState, setHoverState] = useState<'abstract' | 'stadium' | 'stretford'>('abstract');

  return (
    <section className="relative overflow-hidden border border-brand-border rounded-2xl shadow-2xl min-h-[500px] flex items-center justify-start p-6 md:p-12">
      {/* Background Images with Crossfade */}
      <div className="absolute inset-0 bg-[#0B0E14]">
        <Image
          src="/hero/abstract.jpg"
          alt="Abstract Red Fabric"
          fill
          className={`object-cover transition-opacity duration-1000 ease-in-out ${hoverState === 'abstract' ? 'opacity-40' : 'opacity-0'}`}
          priority
        />
        <Image
          src="/hero/stadium.jpg"
          alt="Old Trafford Stadium Night"
          fill
          className={`object-cover transition-opacity duration-1000 ease-in-out ${hoverState === 'stadium' ? 'opacity-40' : 'opacity-0'}`}
        />
        <Image
          src="/hero/stretford.jpg"
          alt="Stretford End Fans"
          fill
          className={`object-cover transition-opacity duration-1000 ease-in-out ${hoverState === 'stretford' ? 'opacity-40' : 'opacity-0'}`}
        />
      </div>

      {/* Gritty Noise Overlay */}
      <div className="absolute inset-0 bg-noise opacity-[0.25] mix-blend-overlay pointer-events-none z-0"></div>
      
      {/* Cinematic Floodlights */}
      <div className="absolute -top-40 -right-40 w-[800px] h-[800px] bg-brand-red/20 rounded-full blur-[120px] pointer-events-none z-0"></div>
      <div className="absolute -top-20 -left-20 w-[500px] h-[500px] bg-brand-red/10 rounded-full blur-[100px] pointer-events-none z-0"></div>
      
      {/* Glassmorphism Container */}
      <div className="relative z-10 max-w-3xl backdrop-blur-md bg-brand-slate/40 border border-brand-red/20 rounded-2xl p-8 md:p-10 shadow-[0_0_40px_rgba(218,41,28,0.15)]">
        <div className="space-y-4 max-w-2xl">
          <span
            className="bg-[#DA291C] text-white text-xs font-black uppercase px-3 py-1 rounded tracking-widest inline-block animate-fade-in-up"
            style={{ animationDelay: '0ms', animationFillMode: 'forwards' }}
          >
            The United Data Hub
          </span>
          <h1
            className={`${bebas.className} text-5xl md:text-7xl tracking-wide text-white leading-none drop-shadow-lg animate-fade-in-up`}
            style={{ animationDelay: '150ms', animationFillMode: 'forwards' }}
          >
            THE HEARTBEAT OF <span className={`${teko.className} text-brand-red font-bold text-6xl md:text-8xl tracking-normal uppercase`}>OLD TRAFFORD</span>
          </h1>
          <p
            className={`${inter.className} text-gray-300 text-sm md:text-base leading-relaxed animate-fade-in-up`}
            style={{ animationDelay: '300ms', animationFillMode: 'forwards' }}
          >
            High-density statistical tracking, live match intelligence, and deep performance analytics for Manchester United.
          </p>
          <div
            className="flex flex-col sm:flex-row flex-wrap gap-4 pt-2 animate-fade-in-up"
            style={{ animationDelay: '450ms', animationFillMode: 'forwards' }}
          >
            <Link
              href="/fixtures"
              onMouseEnter={() => setHoverState('stretford')}
              onMouseLeave={() => setHoverState('abstract')}
              className="w-full sm:w-auto text-center bg-[#DA291C] hover:bg-[#7A0006] text-white px-6 py-3 rounded font-bold text-sm uppercase tracking-wider shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-[0_0_20px_rgba(218,41,28,0.5)]"
            >
              Match Calendar →
            </Link>
            <Link
              href="/squad"
              onMouseEnter={() => setHoverState('stadium')}
              onMouseLeave={() => setHoverState('abstract')}
              className="w-full sm:w-auto text-center bg-transparent hover:bg-brand-red/20 border border-brand-red/30 hover:border-brand-red text-gray-200 hover:text-white px-6 py-3 rounded font-bold text-sm uppercase tracking-wider transition-all duration-300 hover:scale-105 hover:shadow-[0_0_15px_rgba(218,41,28,0.3)] backdrop-blur-sm"
            >
              Players Directory
            </Link>
          </div>
        </div>

        {/* Heartbeat Visual */}
        <div className="mt-8 pt-6 border-t border-brand-red/10">
          <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-brand-red to-transparent animate-heartbeat-pulse rounded-full shadow-[0_0_8px_rgba(218,41,28,0.8)]"></div>
        </div>
      </div>
    </section>
  );
}
