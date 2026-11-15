import React from 'react';

interface Props {
  subtitulo?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const NeoEnviosLogo: React.FC<Props> = ({
  subtitulo = "Logística & Envíos",
  size = "md",
  className = ""
}) => {
  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Isotipo: Faro y Ondas Neón Violeta y Cian */}
      <div className="relative w-9 h-9 shrink-0 flex items-center justify-center rounded-2xl bg-zinc-950 border border-violet-500/40 shadow-[0_0_15px_rgba(139,92,246,0.35)] p-1.5 transition-transform hover:scale-105">
        <div className="absolute inset-0 bg-gradient-to-tr from-violet-600/30 via-transparent to-cyan-400/30 rounded-2xl pointer-events-none" />
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full filter drop-shadow-[0_0_6px_rgba(6,182,212,0.8)]"
        >
          <defs>
            <linearGradient id="grad-neoenvios" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#06b6d4" />
              <stop offset="50%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#ec4899" />
            </linearGradient>
          </defs>
          <path
            d="M38 78 L44 32 L56 32 L62 78 Z"
            stroke="url(#grad-neoenvios)"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="M40 54 L60 54" stroke="url(#grad-neoenvios)" strokeWidth="4" />
          <path d="M42 42 L58 42" stroke="url(#grad-neoenvios)" strokeWidth="4" />
          <path
            d="M40 32 L50 20 L60 32"
            stroke="url(#grad-neoenvios)"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="50" cy="27" r="4" fill="#06b6d4" className="animate-pulse" />
          <path
            d="M20 50 A 32 32 0 0 1 28 30"
            stroke="#06b6d4"
            strokeWidth="4"
            strokeLinecap="round"
            opacity="0.85"
          />
          <path
            d="M80 50 A 32 32 0 0 0 72 30"
            stroke="#8b5cf6"
            strokeWidth="4"
            strokeLinecap="round"
            opacity="0.85"
          />
        </svg>
      </div>

      {/* Tipografía NeoFaro */}
      <div className="flex flex-col leading-tight">
        <div className="flex items-baseline gap-1 font-black tracking-tight text-base sm:text-lg">
          <span className="text-white">Neo</span>
          <span className="bg-gradient-to-r from-violet-400 via-purple-300 to-cyan-300 bg-clip-text text-transparent">
            Envíos
          </span>
          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-violet-950/80 text-violet-300 font-mono border border-violet-500/30">
            Faro
          </span>
        </div>
        {subtitulo && (
          <span className="text-[10px] text-zinc-400 font-medium">
            {subtitulo}
          </span>
        )}
      </div>
    </div>
  );
};

