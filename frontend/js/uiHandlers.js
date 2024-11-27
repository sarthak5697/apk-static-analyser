import {
  fetchAppDetailsApi,
  fetchVersionDetailsApi,
  fetchCompareAppDetailsApi,
} from "./api.js";
import { renderGrid } from "./rendering.js";

let latestFetchedData = [];
let activeForm = "apkForm";
let tableSource = "";

async function populateDropdown(selectElementId, packageDetails) {
  const selectElement = document.getElementById(selectElementId);
  // Sort packageDetails alphabetically by APP_NAME
  packageDetails.sort((a, b) => a.APP_NAME.localeCompare(b.APP_NAME));


  packageDetails.forEach((detail) => {
    const option = document.createElement("option");
    option.value = JSON.stringify({
      packageName: detail.PACKAGE_NAME,
      versionName: detail.VERSION_NAME
    });
    option.textContent = `${detail.APP_NAME} (${detail.VERSION_NAME})`;
    selectElement.appendChild(option);
  });
}




export async function populateAPKDropdown() {
  try {
    const packageDetails = await fetchAppDetailsApi();
    if (packageDetails && packageDetails.length > 0) {
      const packageNameSelect = document.getElementById("packageName");

      // Group packages by APP_NAME and count versions
      const groupedPackages = packageDetails.reduce((acc, detail) => {
        if (!acc[detail.APP_NAME]) {
          acc[detail.APP_NAME] = {
            packageName: detail.PACKAGE_NAME,
            versions: new Set(),
            latestVersion: detail.VERSION_NAME
          };
        }
        acc[detail.APP_NAME].versions.add(detail.VERSION_NAME);
        // Update latest version if current version is greater
        if (detail.VERSION_NAME > acc[detail.APP_NAME].latestVersion) {
          acc[detail.APP_NAME].latestVersion = detail.VERSION_NAME;
        }
        return acc;
      }, {});

      // Convert to array and sort by APP_NAME
      const sortedPackages = Object.entries(groupedPackages)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([appName, details]) => ({
          appName,
          packageName: details.packageName,
          versionCount: details.versions.size,
          latestVersion: details.latestVersion
        }));

      // Clear existing options
      packageNameSelect.innerHTML = '<option value="" disabled selected>Select an app</option>';

      // Add sorted options to dropdown
      sortedPackages.forEach((app) => {
        const option = document.createElement("option");
        option.value = JSON.stringify({
          packageName: app.packageName,
          versionName: app.latestVersion
        });
        option.textContent = `${app.appName} (${app.versionCount} version${app.versionCount !== 1 ? 's' : ''})`;
        packageNameSelect.appendChild(option);
      });
    } else {
      throw new Error("No package details received");
    }
  } catch (error) {
    console.error("Error populating APK dropdown:", error);
    alert("Failed to load APK packages. Please try again.");
  }
}

export async function populateCompareDropdowns() {
  try {
    const packageDetails = await fetchAppDetailsApi();
    if (packageDetails && packageDetails.length > 0) {
      await Promise.all([
        populateDropdown("packageName1", packageDetails),
        populateDropdown("packageName2", packageDetails)
      ]);
    } else {
      throw new Error("No package details received");
    }
  } catch (error) {
    console.error("Error populating compare dropdowns:", error);
    alert("Failed to load app details. Please try again.");
  }
}

function getFormData(formId) {
  const form = document.getElementById(formId);
  const packageData1 = JSON.parse(form.querySelector("#packageName1")?.value || "{}");
  const packageData2 = JSON.parse(form.querySelector("#packageName2")?.value || "{}");
  const highlightDifferences = document.getElementById("highlightDifferences").checked;
  const hideCommonFeatures = document.getElementById("hideCommonFeatures").checked;

  return { packageData1, packageData2, highlightDifferences, hideCommonFeatures };
}

export function initCompareForm() {
  const compareForm = document.getElementById("compareForm");
  if (compareForm) {
    compareForm.addEventListener("submit", async function (event) {
      event.preventDefault();
      activeForm = "compareForm";
      tableSource = "compareForm";
      const { packageData1, packageData2, highlightDifferences } = getFormData("compareForm");
      const submitButton = compareForm.querySelector("button");
      submitButton.disabled = true;

      try {
        const data = await fetchCompareAppDetailsApi(
          packageData1.packageName,
          packageData1.versionName,
          packageData2.packageName,
          packageData2.versionName
        );
        latestFetchedData = data;
        renderGrid("grid-container", data, highlightDifferences, false, false);

      } catch (error) {
        console.error("Error comparing applications:", error);
        alert("Failed to compare applications. Please try again.");
      } finally {
        submitButton.disabled = false;
      }
    });
  }
}

export function initAPKForm() {
  const apkForm = document.getElementById("apkForm");
  if (apkForm) {
    apkForm.addEventListener("submit", async function (event) {
      event.preventDefault();
      activeForm = "apkForm";
      tableSource = "apkForm";
      const packageData = JSON.parse(document.getElementById("packageName").value);
      const { highlightDifferences, hideCommonFeatures } = getFormData("apkForm");
      const submitButton = apkForm.querySelector("button");
      submitButton.disabled = true;

      try {
        const data = await fetchVersionDetailsApi(packageData.packageName);
        latestFetchedData = data;
        // renderGrid(
        //   "grid-container",
        //   data,
        //   highlightDifferences,
        //   hideCommonFeatures,
        //   true
        // );
        renderGrid("grid-container", data, highlightDifferences, hideCommonFeatures, true);

      } catch (error) {
        console.error("Error fetching APK details:", error);
        alert("Failed to load APK details. Please try again.");
      } finally {
        submitButton.disabled = false;
      }
    });
  }
}

export function initEventListeners() {
  const highlightDifferencesCheckbox = document.getElementById("highlightDifferences");
  const hideCommonFeaturesCheckbox = document.getElementById("hideCommonFeatures");
  const apkFormWrapper = document.getElementById("apkFormWrapper");
  const compareFormWrapper = document.getElementById("compareFormWrapper");

  highlightDifferencesCheckbox.addEventListener("change", updateGrid);
  hideCommonFeaturesCheckbox.addEventListener("change", updateGrid);

  apkFormWrapper.addEventListener("click", () => setActiveForm("apkForm"));
  compareFormWrapper.addEventListener("click", () => setActiveForm("compareForm"));
}

function updateGrid() {
  const highlightDifferences = document.getElementById("highlightDifferences").checked;
  const hideCommonFeatures = document.getElementById("hideCommonFeatures").checked;

  renderGrid(
    "grid-container",
    latestFetchedData,
    highlightDifferences,
    activeForm === "apkForm" ? hideCommonFeatures : false,
    activeForm === "apkForm"
  );
}

function setActiveForm(form) {
  if (form === "apkForm" && tableSource !== "compareForm") {
    activeForm = "apkForm";
    apkFormWrapper.classList.add("active");
    compareFormWrapper.classList.remove("active");
    document.getElementById("hideCommonFeatures").disabled = false;
  } else if (form === "compareForm") {
    activeForm = "compareForm";
    compareFormWrapper.classList.add("active");
    apkFormWrapper.classList.remove("active");
    document.getElementById("hideCommonFeatures").disabled = true;
  }
  updateGrid();
}