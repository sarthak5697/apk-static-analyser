import { parseChips, compareChip, isChipRemoved, initializeChipValues } from "./utils.js";

export function compareChipField(key, values) {
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