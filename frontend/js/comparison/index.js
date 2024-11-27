import { sortDataByVersion } from "../dataProcessing.js";
import { CHIP_FIELDS } from "./constants.js";
import { compareChipField } from "./chipComparison.js";
import { compareNonChipField } from "./nonChipComparison.js";


window.memoizationCache = new Map();

const memoize = (fn) => {
    return (...args) => {
        const key = JSON.stringify(args);
        if (window.memoizationCache.has(key)) {
            console.log("Using memoized result for key:", key);
            return window.memoizationCache.get(key);
        }
        const result = fn(...args);
        window.memoizationCache.set(key, result);
        console.log("Caching result for key:", key);
        return result;
    };
};

export const compareJSONData = memoize((data, isApkForm = false) => {
    console.group("compareJSONData");
    console.log("Input data:", data.map(item => `${item.APP_NAME} ${item.VERSION_NAME}`));

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
});


// Function to view cache contents
window.viewCache = () => {
    console.log("Current memoization cache:");
    for (let [key, value] of window.memoizationCache) {
        console.log(`Key: ${key}`);
        console.log("Value:", value);
        console.log("---");
    }
};

// Function to clear the cache
window.clearCache = () => {
    window.memoizationCache.clear();
    console.log("Memoization cache cleared");
};

// Function to get cache size
window.getCacheSize = () => {
    console.log(`Cache size: ${window.memoizationCache.size} entries`);
};