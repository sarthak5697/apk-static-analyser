// Common function to create a basic chip
function createBasicChip(content, className, tooltipContent = "") {
  const chip = document.createElement("span");
  chip.className = `chip ${className}`;
  chip.textContent = content;

  if (tooltipContent) {
    const tooltip = document.createElement("span");
    tooltip.className = "tooltiptext";
    tooltip.innerHTML = tooltipContent;
    chip.appendChild(tooltip);
    chip.classList.add("tooltip");
  }

  return chip;
}

export function createChip(content, type, tooltipContent = "") {
  return createBasicChip(content, `${type}-chip`, tooltipContent);
}

export function createDomainChip(domain, ip, country) {
  const tooltipContent = `
    <strong>IP:</strong> ${ip || 'N/A'}<br>
    <strong>Country:</strong> ${country || 'N/A'}
  `;
  return createBasicChip(domain, "domain-chip", tooltipContent);
}

export function createTrackerChip(name, url, categories) {
  const chip = document.createElement("a");
  chip.href = url || '#';
  chip.target = "_blank";
  chip.className = "chip tracker-chip tooltip";
  chip.textContent = name || 'Unknown Tracker';

  const tooltip = document.createElement("span");
  tooltip.className = "tooltiptext";
  tooltip.innerHTML = `<strong>Categories:</strong> ${categories || 'N/A'}`;
  chip.appendChild(tooltip);

  return chip;
}

export function createPermissionChip(permission, status, info, description) {
  const tooltipContent = `
    <strong>Status:</strong> ${status || 'N/A'}<br>
    <strong>Info:</strong> ${info || 'N/A'}<br>
    <strong>Description:</strong> ${description || 'N/A'}
  `;
  return createBasicChip(permission, "permission-chip", tooltipContent);
}

export function createCodeAnalysisChip(item, field) {
  let mainText;
  switch (field) {
    case "CODE_ANALYSIS_MASVS":
      mainText = item.masvs || "N/A";
      break;
    case "CODE_ANALYSIS_CWE":
      mainText = item.cwe || "N/A";
      break;
    case "CODE_ANALYSIS_OWASP":
      mainText = item.owaspMobile || "N/A";
      break;
    default:
      mainText = "Unknown";
  }

  const tooltipContent = `
    <strong>Issue Type:</strong> ${item.issueType || "N/A"}<br>
    <strong>Severity:</strong> ${item.severity || "N/A"}<br>
    <strong>Description:</strong> ${item.description || "N/A"}<br>
    <strong>CVSS:</strong> ${item.cvss || "N/A"}<br>
    <strong>CWE:</strong> ${item.cwe || "N/A"}<br>
    <strong>MASVS:</strong> ${item.masvs || "N/A"}<br>
    <strong>OWASP Mobile:</strong> ${item.owaspMobile || "N/A"}<br>
    <strong>Reference:</strong> ${item.reference
      ? `<a href="${item.reference}" target="_blank">Link</a>`
      : "N/A"
    }
  `;

  const chip = createBasicChip(mainText, "code-analysis-chip", tooltipContent);
  chip.classList.add(`${item.severity}-chip`);
  return chip;
}