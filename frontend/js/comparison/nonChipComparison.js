export function compareNonChipField(values) {
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