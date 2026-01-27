export const useFormatters = () => {
  const formatNumber = (num: number): string => {
    const absx = Math.abs(num);
    if (absx === 0) return "0";
    if (!isFinite(num)) return "∞";
    if (absx < 1e6) return Math.round(num).toLocaleString('en-US');

    const suffixes = ["M", "B", "T", "Q", "QQ", "QQQ"];
    const exponent = Math.floor(Math.log10(absx) + 1e-10);

    let sIdx = 0;
    if (exponent >= 24) sIdx = -1;
    else if (exponent >= 22) sIdx = 5;
    else if (exponent >= 19) sIdx = 4;
    else if (exponent >= 16) sIdx = 3;
    else if (exponent >= 13) sIdx = 2;
    else if (exponent >= 10) sIdx = 1;
    else sIdx = 0;

    if (sIdx === -1) {
      const e = exponent;
      const base = num / Math.pow(10, e);
      return (Math.floor(base * 100) / 100).toString() + "E" + e;
    }

    const bases = [1e6, 1e9, 1e12, 1e15, 1e18, 1e21];
    const unitBase = bases[sIdx] ?? 1e6;
    const unitVal = num / unitBase;
    const suffix = suffixes[sIdx] ?? "";

    if (sIdx === 0) {
      if (unitVal < 10) return (Math.ceil(num / 10000) / 100).toFixed(2).replace(/\.?0+$/, "") + "M";
      if (unitVal < 100) return (Math.ceil(num / 100000) / 10).toFixed(1).replace(/\.?0+$/, "") + "M";
      return Math.ceil(unitVal).toString() + "M";
    }

    return Math.ceil(unitVal).toString() + suffix;
  };

  const parseNumber = (input: string | number): number => {
    if (typeof input === "number") return input;
    if (!input) return 0;
    const str = input.toUpperCase().trim().replace(/,/g, "");
    const suffixes: Record<string, number> = {
      'K': 1e3, 'M': 1e6, 'B': 1e9, 'T': 1e12, 'Q': 1e15, 'QQ': 1e18, 'QQQ': 1e21
    };
    const match = str.match(/^([0-9.]+)\s*([A-Z]*)$/);
    if (!match) return parseFloat(str) || 0;
    const val = parseFloat(match[1] || "0");
    const suffix = match[2] || "";
    const multiplier = suffixes[suffix];
    if (multiplier !== undefined) {
      return val * multiplier;
    }
    return val;
  };

  const formatTime = (seconds: number): string => {
    if (seconds <= 0) return "Ready!";
    if (seconds === Infinity || isNaN(seconds)) return "∞";

    const years = Math.floor(seconds / (3600 * 24 * 365));
    if (years > 100000000) return "Million ages";

    let rem = seconds % (3600 * 24 * 365);
    const months = Math.floor(rem / (3600 * 24 * 30));

    rem = rem % (3600 * 24 * 30);
    const days = Math.floor(rem / (3600 * 24));

    rem = rem % (3600 * 24);
    const hours = Math.floor(rem / 3600);

    rem = rem % 3600;
    const mins = Math.floor(rem / 60);
    const secs = Math.floor(rem % 60);

    const parts = [];
    if (years > 0) parts.push(`${years}y`);
    if (months > 0) parts.push(`${months}mo`);
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (mins > 0) parts.push(`${mins}m`);
    if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);

    return parts.slice(0, 2).join(" ");
  };

  const formatMultiplier = (num: number): string => {
    if (num === 0) return "0";
    if (num < 1000) {
      return num.toFixed(2).replace(/\.?0+$/, "");
    }
    return formatNumber(num);
  };

  return { formatNumber, parseNumber, formatTime, formatMultiplier };
};