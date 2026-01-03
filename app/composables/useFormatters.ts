export const useFormatters = () => {
  const formatNumber = (num: number): string => {
    const absx = Math.abs(num);
    if (absx === 0) return "0";

    const digits = Math.floor(Math.log10(absx) + 1e-10) + 1;

    if (digits <= 6) {
      return num.toLocaleString('en-US');
    }

    const suffixes = ["", "", "M", "B", "T", "Q", "QQ", "QQQ"];

    if (digits === 7) {
      const val = Math.ceil(num / 10000) / 100;
      return val.toString() + "M";
    }
    if (digits === 8) {
      const val = Math.ceil(num / 100000) / 10;
      return val.toString() + "M";
    }
    if (digits === 9 || digits === 10) return Math.ceil(num / 1e6) + "M";

    if (digits >= 11) {
      const sIdx = Math.floor((digits - 11) / 3) + 3;
      if (sIdx >= suffixes.length) {
        const exponent = digits - 1;
        const base = num / Math.pow(10, exponent);
        const floored = Math.floor(base * 100) / 100;
        return floored.toString() + "E" + exponent;
      }
      const d = Math.pow(10, sIdx * 3);
      const rem = (digits - 11) % 3;
      if (rem === 0) {
        const val = Math.ceil(num / (d / 10)) / 10;
        return val.toString() + (suffixes[sIdx] ?? "");
      }
      return Math.ceil(num / d) + (suffixes[sIdx] ?? "");
    }

    return num.toString();
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

    const years = Math.round(seconds / (3600 * 24 * 365));
    if (years > 100000000) return "Million ages";

    const months = Math.round((seconds % (3600 * 24 * 365)) / (3600 * 24 * 30));
    const days = Math.round((seconds % (3600 * 24 * 30)) / (3600 * 24));
    const hours = Math.round((seconds % (3600 * 24)) / 3600);
    const mins = Math.round((seconds % 3600) / 60);
    const secs = Math.round(seconds % 60);

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