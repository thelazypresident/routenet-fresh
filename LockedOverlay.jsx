import React from "react";
import { Lock } from "lucide-react";

export default function LockedOverlay({
  title = "Premium Feature",
  subtitle = "Unlock with Premium",
  onClick,
}) {
  return (
    // ✅ Overlay should NEVER block the whole page.
    // pointer-events-none = taps pass through
    <div className="absolute inset-0 z-20 pointer-events-none">
      {/* soft blur layer (also non-blocking) */}
      <div className="absolute inset-0 rounded-xl bg-white/40 backdrop-blur-[2px] dark:bg-black/30" />

      {/* content box */}
      <div className="absolute inset-0 flex items-center justify-center p-3">
        <div className="pointer-events-auto w-full max-w-[260px] rounded-xl border border-white/30 bg-white/80 px-3 py-3 shadow-md backdrop-blur dark:bg-black/60 dark:border-white/10">
          <div className="flex items-start gap-2">
            <div className="mt-0.5 rounded-full bg-amber-200/70 p-1.5 dark:bg-amber-400/20">
              <Lock className="h-4 w-4 text-amber-800 dark:text-amber-300" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="text-[12px] font-bold text-gray-900 dark:text-white">
                {title}
              </div>
              <div className="mt-0.5 text-[11px] text-gray-700/80 dark:text-white/70">
                {subtitle}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClick?.();
            }}
            className="mt-3 w-full rounded-lg bg-gradient-to-r from-[#66BB6A] via-[#A5D6A7] to-[#FACC15] px-3 py-2 text-[12px] font-extrabold text-black active:opacity-90"
          >
            Unlock Premium
          </button>
        </div>
      </div>
    </div>
  );
}