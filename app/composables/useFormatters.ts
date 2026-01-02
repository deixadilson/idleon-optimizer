export const useFormatters = () => {
  const formatNumber = (num: number): string => {
    const absx = Math.abs(num);
    if (absx === 0) return "0";

    if (absx < 1000000) {
      return Math.floor(num).toLocaleString('en-US');
    }

    if (absx < 10000000000) {
      return Math.round(num / 1000000) + "M";
    } else if (absx < 10000000000000) {
      return Math.round(num / 1000000000) + "B";
    } else if (absx < 10000000000000000) {
      return Math.round(num / 1000000000000) + "T";
    } else if (absx < 10000000000000000000) {
      return Math.round(num / 1000000000000000) + "Q";
    } else if (absx < 1e22) {
      return Math.round(num / 1e18) + "QQ";
    } else if (absx < 1e25) {
      return Math.round(num / 1e21) + "QQQ";
    } else {
      return num.toExponential(2).toUpperCase().replace("+", "");
    }
  };

  const parseNumber = (input: string | number): number => {
    if (typeof input === "number") return input;
    if (!input) return 0;
    const str = input.toUpperCase().trim().replace(/,/g, "");
    const suffixes: Record<string, number> = {
      'M': 1e6, 'B': 1e9, 'T': 1e12, 'Q': 1e15, 'QQ': 1e18, 'QQQ': 1e21
    };
    const match = str.match(/^([0-9.]+)\s*([A-Z]*)$/);
    if (!match) return parseFloat(str) || 0;
    const val = parseFloat(match[1]);
    const suffix = match[2];
    return suffixes[suffix] ? val * suffixes[suffix] : val;
  };

  const formatTime = (seconds: number): string => {
    if (seconds <= 0) return "Ready!";
    if (seconds === Infinity || isNaN(seconds)) return "∞";

    const years = Math.floor(seconds / (3600 * 24 * 365));
    
    if (years > 100000000) return "Million ages";

    const months = Math.floor((seconds % (3600 * 24 * 365)) / (3600 * 24 * 30));
    const days = Math.floor((seconds % (3600 * 24 * 30)) / (3600 * 24));
    const hours = Math.floor((seconds % (3600 * 24)) / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    const parts = [];
    if (years > 0) parts.push(`${years}y`);
    if (months > 0) parts.push(`${months}mo`);
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (mins > 0) parts.push(`${mins}m`);
    if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);

    return parts.slice(0, 2).join(" ");
  };

  return { formatNumber, parseNumber, formatTime };
};