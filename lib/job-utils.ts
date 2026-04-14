export function timeAgo(dateStr: string | null): string {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return mins <= 1 ? "just now" : `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function trackBadge(track: string): string {
  switch (track) {
    case "software": return "bg-blue-50 text-blue-700";
    case "data":     return "bg-teal-50 text-teal-700";
    case "aiml":     return "bg-violet-50 text-violet-700";
    default:         return "bg-gray-100 text-gray-600";
  }
}

export function levelBadge(level: string): string {
  switch (level) {
    case "senior": return "bg-amber-50 text-amber-700";
    case "junior": return "bg-green-50 text-green-700";
    default:       return "bg-gray-100 text-gray-600";
  }
}

export function sourceBadge(source: string): string {
  switch (source) {
    case "greenhouse":     return "bg-emerald-50 text-emerald-700";
    case "lever":          return "bg-sky-50 text-sky-700";
    case "ashby":          return "bg-purple-50 text-purple-700";
    case "smartrecruiters": return "bg-orange-50 text-orange-700";
    case "workday":        return "bg-slate-100 text-slate-600";
    default:               return "bg-gray-100 text-gray-500";
  }
}

