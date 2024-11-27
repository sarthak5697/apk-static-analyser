import { sortDataByVersion } from "./dataProcessing.js";

const CHIP_FIELDS = [
  "TOP_MALWARE_PERMISSIONS",
  "PERMISSIONS",
  "OTHER_ABUSED_PERMISSIONS",
  "TRACKER_DETAILS",
  "DOMAINS",
  "CODE_ANALYSIS_MASVS",
  "CODE_ANALYSIS_CWE",
  "CODE_ANALYSIS_OWASP",
];

export function compareJSONData(data, isApkForm = false) {
  console.group("compareJSONData");
  console.log("Input data:", data.map(item => `${item.APP_NAME} ${item.VERSION_NAME}`));

  // Only sort the data if it's for the apkForm
  const dataToCompare = isApkForm ? sortDataByVersion(data) : data;
  console.log("Data to compare:", dataToCompare.map(item => `${item.APP_NAME} ${item.VERSION_NAME}`));

  const allKeys = new Set(dataToCompare.flatMap((obj) => Object.keys(obj)));
  console.log("All keys found:", [...allKeys]);

  const comparisonResult = Array.from(allKeys).reduce((result, key) => {
    console.group(`Comparing field: ${key}`);
    const values = dataToCompare.map((obj) => obj[key]);
    console.log("Values for this field:", values);

    result[key] = CHIP_FIELDS.includes(key)
      ? compareChipField(key, values)
      : compareNonChipField(values);

    console.groupEnd();
    return result;
  }, {});

  console.log("Output data:", comparisonResult.APP_NAME.values.map(v => v.value));
  console.groupEnd();
  return comparisonResult;
}

// export function compareJSONData(data) {
//   console.group("Starting JSON Data Comparison");
//   console.log("Data to compare:", data);

//   const sortedData = sortDataByVersion(data);
//   console.log("Sorted data:", sortedData);

//   const allKeys = new Set(sortedData.flatMap((obj) => Object.keys(obj)));
//   console.log("All keys found:", [...allKeys]);

//   const comparisonResult = Array.from(allKeys).reduce((result, key) => {
//     console.group(`Comparing field: ${key}`);
//     const values = sortedData.map((obj) => obj[key]);
//     console.log("Values for this field:", values);

//     result[key] = CHIP_FIELDS.includes(key)
//       ? compareChipField(key, values)
//       : compareNonChipField(values);

//     console.groupEnd();
//     return result;
//   }, {});

//   console.log("Final comparison result:", comparisonResult);
//   console.groupEnd();

//   return comparisonResult;
// }


// export function compareJSONData(data, isApkForm = false) {
//   console.group("compareJSONData");
//   console.log("Input data:", data.map(item => `${item.APP_NAME} ${item.VERSION_NAME}`));

//   // No need to sort the data, it should already be in the correct order from the backend

//   const allKeys = new Set(data.flatMap((obj) => Object.keys(obj)));
//   console.log("All keys found:", [...allKeys]);

//   const comparisonResult = Array.from(allKeys).reduce((result, key) => {
//     console.group(`Comparing field: ${key}`);
//     const values = data.map((obj) => obj[key]);
//     console.log("Values for this field:", values);

//     result[key] = CHIP_FIELDS.includes(key)
//       ? compareChipField(key, values)
//       : compareNonChipField(values);

//     console.groupEnd();
//     return result;
//   }, {});

//   console.log("Output data:", comparisonResult.APP_NAME.values.map(v => v.value));
//   console.groupEnd();
//   return comparisonResult;
// }

function compareChipField(key, values) {
  console.group(`compareChipField for ${key}`);
  console.log("Values:", values);

  const result = {
    isDifferent: false,
    values: values.map((val, index) => {
      if (index === 0) return initializeChipValues(val);

      const prevVal = values[index - 1];
      const { chipStatus, allChips } = computeChipStatus(key, val, prevVal);

      console.log(`Computed chip status for index ${index}:`, chipStatus);
      console.log(`All chips for index ${index}:`, allChips);

      return { value: allChips, chipStatus };
    }),
  };

  result.isDifferent = result.values.some((v) =>
    v.chipStatus.some((status) => status !== "unchanged")
  );

  console.log("Final result:", result);
  console.groupEnd();
  return result;
}

function computeChipStatus(key, currentVal, prevVal) {
  console.group(`computeChipStatus for ${key}`);
  console.log("Current value:", currentVal);
  console.log("Previous value:", prevVal);

  const currentChips = Array.isArray(currentVal) ? currentVal : parseChips(currentVal);
  const prevChips = Array.isArray(prevVal) ? prevVal : parseChips(prevVal);

  console.log("Parsed current chips:", currentChips);
  console.log("Parsed previous chips:", prevChips);

  const chipStatus = currentChips.map((chip) => compareChip(key, chip, prevChips));
  const removedChips = prevChips.filter((prevChip) => isChipRemoved(key, prevChip, currentChips));

  const allChips = [...currentChips, ...removedChips];
  const allStatuses = [...chipStatus, ...Array(removedChips.length).fill("removed")];

  console.log("Final chip status:", allStatuses);
  console.log("Final all chips:", allChips);
  console.groupEnd();
  return { chipStatus: allStatuses, allChips };
}

function initializeChipValues(val) {
  const initialChips = Array.isArray(val) ? val : parseChips(val);
  return {
    value: initialChips,
    chipStatus: Array(initialChips.length).fill("unchanged"),
  };
}

function parseChips(val) {
  if (Array.isArray(val)) return val;
  if (typeof val === "string") return val.split(", ");
  if (typeof val === "object" && val !== null) return Object.values(val);
  return [];
}

function compareChip(key, chip, prevChips) {
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

function isChipRemoved(key, prevChip, currentChips) {
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

function compareNonChipField(values) {
  console.log("Comparing non-chip field:", values);

  const uniqueValues = new Set(values.map(JSON.stringify));
  console.log("Unique values:", [...uniqueValues].map(JSON.parse));

  const isDifferent = uniqueValues.size > 1;
  const comparedValues = values.map((val, index) => ({
    value: val,
    isUnique: index > 0 && JSON.stringify(val) !== JSON.stringify(values[index - 1]),
  }));

  return { isDifferent, values: comparedValues };
}