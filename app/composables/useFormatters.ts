export const useFormatters = () => {
  const suffixes = ["", "K", "M", "B", "T", "Q", "QQ", "QQQ"];

  const formatNumber = (num: number): string => {
    if (num === 0) return "0";
    if (num < 1000) return num.toFixed(2).replace(/\.00$/, "");

    const i = Math.floor(Math.log10(num) / 3);

    if (i >= suffixes.length) {
      return num.toExponential(2).toUpperCase().replace("+", "");
    }

    const val = num / Math.pow(1000, i);
    const decimals = val >= 100 ? 0 : 2;
    return val.toFixed(decimals).replace(/\.00$/, "") + suffixes[i];
  };

  const parseNumber = (input: string | number): number => {
    if (typeof input === "number") return input;
    if (!input) return 0;
    const str = input.toUpperCase().trim().replace(/,/g, "");

    if (str.includes("E")) {
      const parsed = parseFloat(str);
      return isNaN(parsed) ? 0 : parsed;
    }

    const match = str.match(/^([0-9.]+)\s*([A-Z]*)$/);
    if (!match || !match[1]) return parseFloat(str) || 0;

    const val = parseFloat(match[1]);
    const suffix = match[2] || "";
    const index = suffixes.indexOf(suffix);

    return index === -1 ? val : val * Math.pow(1000, index);
  };

  const formatTime = (seconds: number): string => {
    if (seconds <= 0) return "Ready!";
    if (seconds === Infinity || isNaN(seconds)) return "∞";
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (d > 0) return `${d}d ${h}h`;
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  return { formatNumber, parseNumber, formatTime };
};