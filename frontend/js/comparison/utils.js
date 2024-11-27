export function parseChips(val) {
    if (Array.isArray(val)) return val;
    if (typeof val === "string") return val.split(", ");
    if (typeof val === "object" && val !== null) return Object.values(val);
    return [];
  }
  
  export function compareChip(key, chip, prevChips) {
    const comparisonFunctions = {
      DOMAINS: (c, pc) => pc.some((prevChip) => prevChip.domain === c.domain),
      TRACKER_DETAILS: (c, pc) => pc.some((prevChip) => prevChip.name === c.name),
      PERMISSIONS: (c, pc) => pc.some((prevChip) => prevChip.permission === c.permission),
      CODE_ANALYSIS_MASVS: (c, pc) => pc.some((prevChip) => prevChip.issueType === c.issueType),
      CODE_ANALYSIS_CWE: (c, pc) => pc.some((prevChip) => prevChip.issueType === c.issueType),
      CODE_ANALYSIS_OWASP: (c, pc) => pc.some((prevChip) => prevChip.issueType === c.issueType),
    };
  
    const compareFunction = comparisonFunctions[key] || ((c, pc) => pc.includes(c));
    return compareFunction(chip, prevChips) ? "unchanged" : "new";
  }
  
  export function isChipRemoved(key, prevChip, currentChips) {
    const removalFunctions = {
      DOMAINS: (pc, cc) => !cc.some((chip) => chip.domain === pc.domain),
      TRACKER_DETAILS: (pc, cc) => !cc.some((chip) => chip.name === pc.name),
      PERMISSIONS: (pc, cc) => !cc.some((chip) => chip.permission === pc.permission),
      CODE_ANALYSIS_MASVS: (pc, cc) => !cc.some((chip) => chip.issueType === pc.issueType),
      CODE_ANALYSIS_CWE: (pc, cc) => !cc.some((chip) => chip.issueType === pc.issueType),
      CODE_ANALYSIS_OWASP: (pc, cc) => !cc.some((chip) => chip.issueType === pc.issueType),
    };
  
    const removalFunction = removalFunctions[key] || ((pc, cc) => !cc.includes(pc));
    return removalFunction(prevChip, currentChips);
  }
  
  export function initializeChipValues(val) {
    const initialChips = Array.isArray(val) ? val : parseChips(val);
    return {
      value: initialChips,
      chipStatus: Array(initialChips.length).fill("unchanged"),
    };
  }