const API_BASE_URL = 'http://localhost:8080';
const DEFAULT_TIMEOUT = 8000; // 8 seconds
const MAX_RETRIES = 3;

// Fetch with timeout
const fetchWithTimeout = (url, options, timeout = DEFAULT_TIMEOUT) => {
    return Promise.race([
        fetch(url, options),
        new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Request timed out')), timeout)
        )
    ]);
};

// Fetch with retry
const fetchWithRetry = async (url, options, retries = MAX_RETRIES) => {
    try {
        return await fetchWithTimeout(url, options);
    } catch (err) {
        if (retries > 0) {
            console.log(`Retrying... (${MAX_RETRIES - retries + 1}/${MAX_RETRIES})`);
            return fetchWithRetry(url, options, retries - 1);
        }
        throw err;
    }
};

// Data validation functions
const validateAppDetails = (data) => {
    if (!Array.isArray(data)) throw new Error('Invalid data format: expected an array');
    if (data.length === 0) throw new Error('No app details found');
    // Add more specific validations as needed
    return data;
};

const validateCompareAppDetails = (data) => {
    if (typeof data !== 'object' || data === null) throw new Error('Invalid data format: expected an object');
    // Add more specific validations as needed
    return data;
};

const validateVersionDetails = (data) => {
    if (!Array.isArray(data)) throw new Error('Invalid data format: expected an array');
    if (data.length === 0) throw new Error('No version details found');
    // Add more specific validations as needed
    return data;
};

// API call functions
export async function fetchAppDetailsApi() {
    try {
        const response = await fetchWithRetry(`${API_BASE_URL}/app-details`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return validateAppDetails(data);
    } catch (error) {
        console.error('Fetch app details failed:', error);
        throw error;
    }
}

export async function fetchCompareAppDetailsApi(packageName1, version1, packageName2, version2) {
    try {
        const response = await fetchWithRetry(`${API_BASE_URL}/compare-apps-versions`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                packageName1,
                version1,
                packageName2,
                version2,
            }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return validateCompareAppDetails(data);
    } catch (error) {
        console.error("Error comparing app versions:", error);
        throw error;
    }
}

export async function fetchVersionDetailsApi(packageName) {
    try {
        const response = await fetchWithRetry(`${API_BASE_URL}/accept-package-name`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ packageName }),
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return validateVersionDetails(data);
    } catch (error) {
        console.error('Fetch version details failed:', error);
        throw error;
    }
}