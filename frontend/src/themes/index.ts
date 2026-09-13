export const theme = {
  bg: "bg-cinema-900",
  void: "bg-cinema-950",
  text: "text-white",
  muted: "text-gray-400",
  glass: "bg-cinema-900/70 border border-white/10 backdrop-blur-md",
} as const;

export const seatColors = {
  AVAILABLE: "bg-cinema-700/80 border-cinema-600 text-gray-300 hover:border-cyan-400",
  VIP: "bg-amber-500/20 border-amber-500/40 text-amber-300 hover:border-amber-400",
  COUPLE: "bg-rose-500/20 border-rose-500/40 text-rose-300 hover:border-rose-400",
  SELECTED: "bg-emerald-500 border-emerald-400 text-white shadow-lg shadow-emerald-500/40 scale-105",
  HELD: "bg-amber-500/60 border-amber-400 text-white animate-pulse",
  SOLD: "bg-cinema-950/60 border-white/5 text-gray-600 cursor-not-allowed opacity-40",
} as const;
