export default function CalendarVisibilityWrapper({ children }) {
  return (
    <div
      className="
        fixed inset-0 z-[9999]
        flex items-center justify-center
        bg-black/60 backdrop-blur-sm
      "
    >
      <div
        className="
          w-full max-w-md mx-auto
          rounded-3xl
          bg-[#0E0F14] text-white
          border border-white/20
          shadow-2xl
        "
      >
        {/* FORCE ALL TEXT VISIBLE */}
        <div className="[&_*]:text-white [&_*]:opacity-100">
          {/* FORCE DAY CELLS + BORDERS */}
          <style>
            {`
              button {
                background-color: #1A1C24 !important;
                border: 1px solid rgba(255,255,255,0.25) !important;
                color: #ffffff !important;
              }
              button[aria-selected="true"],
              .selected {
                background-color: #2D3142 !important;
                border-color: rgba(255,255,255,0.5) !important;
              }
            `}
          </style>

          {children}
        </div>
      </div>
    </div>
  );
}