import { compareJSONData } from "./comparison/index.js";
import * as dataProcessing from "./dataProcessing.js";
import {
  createChip,
  createTrackerChip,
  createPermissionChip,
  createDomainChip,
  createCodeAnalysisChip
} from "./chipComponent.js";

const SEVERITY_ORDER = ['high', 'warning', 'info', 'good'];
const FIELDS = [
  "APP_NAME", "PACKAGE_NAME", "SIZE", "SHA256", "NETWORK_FINDINGS",
  "NETWORK_SUMMARY", "DETECTED_TRACKERS", "TRACKER_DETAILS",
  "TOP_MALWARE_PERMISSIONS", "PERMISSIONS", "OTHER_ABUSED_PERMISSIONS",
  "EXPORTED_ACTIVITIES", "EXPORTED_SERVICES", "EXPORTED_RECEIVERS",
  "EXPORTED_PROVIDERS", "DOMAINS", "CODE_ANALYSIS_STATISTICS",
  "CODE_ANALYSIS_MASVS", "CODE_ANALYSIS_CWE", "CODE_ANALYSIS_OWASP"
];
const CHIP_FIELDS = [
  "TOP_MALWARE_PERMISSIONS", "PERMISSIONS", "OTHER_ABUSED_PERMISSIONS",
  "TRACKER_DETAILS", "DOMAINS", "CODE_ANALYSIS_MASVS", "CODE_ANALYSIS_CWE",
  "CODE_ANALYSIS_OWASP", "CODE_ANALYSIS_STATISTICS"
];

function renderChips(items, chipStatus, field, highlightDifferences = false) {
  console.group(`Rendering chips for ${field}`);
  const container = document.createElement("div");
  container.className = "chip-container";

  if (["CODE_ANALYSIS_MASVS", "CODE_ANALYSIS_CWE", "CODE_ANALYSIS_OWASP"].includes(field)) {
    renderCodeAnalysisChips(items, chipStatus, field, highlightDifferences, container);
  } else {
    renderOtherChips(items, chipStatus, field, highlightDifferences, container);
  }

  console.groupEnd();
  return container;
}

function renderCodeAnalysisChips(items, chipStatus, field, highlightDifferences, container) {
  if (!Array.isArray(items)) {
    console.warn(`${field} is not an array`);
    return;
  }

  const sortedItems = items.sort((a, b) =>
    SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity)
  );

  sortedItems.forEach((item, index) => {
    const chip = createCodeAnalysisChip(item, field);
    const status = chipStatus && chipStatus[index] ? chipStatus[index] : "unchanged";

    if (highlightDifferences) {
      chip.classList.remove('high-chip', 'warning-chip', 'info-chip', 'good-chip');
      chip.classList.add(`${status}-chip`);
    } else {
      chip.classList.add(`${item.severity}-chip`);
    }

    container.appendChild(chip);
  });
}

function renderOtherChips(items, chipStatus, field, highlightDifferences, container) {
  if (!Array.isArray(items)) {
    console.warn(`Items for ${field} is not an array`);
    return;
  }

  items.forEach((item, index) => {
    const status = chipStatus && chipStatus[index] ? chipStatus[index] : "unchanged";
    let chip;

    switch (field) {
      case "TRACKER_DETAILS":
        chip = createTrackerChip(item.name, item.url, item.categories);
        break;
      case "PERMISSIONS":
        chip = createPermissionChip(item.permission, item.status, item.info, item.description);
        break;
      case "DOMAINS":
        chip = createDomainChip(item.domain, item.ip, item.country);
        break;
      default:
        chip = createChip(item, "permission");
    }

    if (highlightDifferences) {
      chip.classList.add(`${status}-chip`);
    }

    container.appendChild(chip);
  });
}

function formatCodeAnalysisStatistics(stats) {
  if (!stats || typeof stats !== 'object') {
    return 'N/A';
  }

  let html = `<strong>Total Issues:</strong> ${stats.totalIssues !== undefined ? stats.totalIssues : 'N/A'}<br>`;
  html += '<strong>Issues by Severity:</strong><br>';

  if (Array.isArray(stats.issuesBySeverity) && stats.issuesBySeverity.length > 0) {
    const severityCounts = stats.issuesBySeverity.reduce((acc, issue) => {
      acc[issue.severity] = issue.count;
      return acc;
    }, {});

    SEVERITY_ORDER.forEach(severity => {
      const count = severityCounts[severity] || 0;
      html += `${severity}: ${count}<br>`;
    });
  } else {
    html += 'No issues found';
  }
  return html;
}

function createTableRow(field, result, highlightDifferences, hideCommonFeatures, chipFields) {
  if (!result || (hideCommonFeatures && !result.isDifferent)) return null;

  const row = document.createElement("tr");
  const fieldCell = document.createElement("td");
  fieldCell.textContent = field.replace(/_/g, " ");
  fieldCell.classList.add("field");

  if (highlightDifferences && result.isDifferent) {
    fieldCell.classList.add("field-highlight");
  }
  row.appendChild(fieldCell);

  result.values.forEach(({ value, isUnique, chipStatus }) => {
    const cell = document.createElement("td");

    if (chipFields.includes(field)) {
      const chipContainer = renderChips(value, chipStatus, field, highlightDifferences);
      cell.appendChild(chipContainer);
    } else if (field === "CODE_ANALYSIS_STATISTICS") {
      cell.innerHTML = formatCodeAnalysisStatistics(value);
    } else if (typeof value === 'object' && value !== null) {
      cell.textContent = JSON.stringify(value);
    } else {
      cell.textContent = value !== undefined ? String(value) : "N/A";
    }

    if (highlightDifferences && isUnique) {
      cell.classList.add("highlight");
    }

    row.appendChild(cell);
  });

  return row;
}


export function renderGrid(containerId, data, highlightDifferences, hideCommonFeatures, fromApkForm) {
  console.group("Rendering Grid");
  const container = document.getElementById(containerId);
  container.innerHTML = "";

  if (!data || !data.length) {
    container.innerHTML = "<p class='empty-message'>No data available</p>";
    console.groupEnd();
    return;
  }

  const parsedData = data.map(item =>
    dataProcessing.parseCodeAnalysisData(
      dataProcessing.parseDomains(
        dataProcessing.parseExportedCount(
          dataProcessing.parseNetworkSecurity(
            dataProcessing.parseTrackers(
              dataProcessing.parseMalwarePermissions(
                dataProcessing.parsePermissions(item)
              )
            )
          )
        )
      )
    )
  );

  console.log("Parsed data:", parsedData.map(item => `${item.APP_NAME} ${item.VERSION_NAME}`));

  const comparisonResult = compareJSONData(parsedData, fromApkForm);
  console.log("Comparison result:", comparisonResult.APP_NAME.values.map(v => v.value));

  const table = createTable(parsedData, FIELDS, comparisonResult, highlightDifferences, hideCommonFeatures, CHIP_FIELDS);

  container.appendChild(table);
  console.groupEnd();
}

function createTable(parsedData, fields, comparisonResult, highlightDifferences, hideCommonFeatures, chipFields) {
  const table = document.createElement("table");
  const headerRow = document.createElement("tr");

  const headers = ["Field", ...parsedData.map(item => `${item.APP_NAME} ${item.VERSION_NAME}`)];
  headers.forEach(header => {
    const th = document.createElement("th");
    th.textContent = header;
    headerRow.appendChild(th);
  });
  table.appendChild(headerRow);

  fields.forEach(field => {
    const row = createTableRow(field, comparisonResult[field], highlightDifferences, hideCommonFeatures, chipFields);
    if (row) table.appendChild(row);
  });

  return table;
}