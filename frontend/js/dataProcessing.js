// Helper function to handle JSON parsing
function safeJSONParse(data, defaultValue, fieldName) {
  try {
    return JSON.parse(data.replace(/'/g, '"'));
  } catch (error) {
    console.error(`Error parsing ${fieldName}:`, error);
    console.log(`Raw ${fieldName} value:`, data);
    return defaultValue;
  }
}

export function safePythonDictParse(data, defaultValue, fieldName) {
  try {
    // Replace Python's False, True, and None with JavaScript equivalents
    let jsonString = data
      .replace(/'/g, '"')
      .replace(/: False/g, ": false")
      .replace(/: True/g, ": true")
      .replace(/: None/g, ": null");

    // Handle potential trailing commas
    jsonString = jsonString.replace(/,\s*}/g, "}").replace(/,\s*\]/g, "]");

    return JSON.parse(jsonString);
  } catch (error) {
    console.error(`Error parsing ${fieldName}:`, error);
    console.log(`Raw ${fieldName} value:`, data);
    return defaultValue;
  }
}

export function parseCodeAnalysisData(scan) {
  console.log("Raw CODE_ANALYSIS_DATA:", scan.CODE_ANALYSIS_METADATA);

  let metadata = Array.isArray(scan.CODE_ANALYSIS_METADATA)
    ? scan.CODE_ANALYSIS_METADATA
    : safePythonDictParse(scan.CODE_ANALYSIS_METADATA, [], "CODE_ANALYSIS_METADATA");

  const processedMetadata = metadata.map((item) => ({
    issueType: item.issue_type || "N/A",
    severity: item.severity || "N/A",
    description: item.description || "N/A",
    cvss: item.cvss || "N/A",
    cwe: item.cwe || "N/A",
    masvs: item.masvs || "N/A",
    owaspMobile: item['owasp-mobile'] || "N/A",
    reference: item.ref || "N/A",
  }));
  console.log("final processed chip analysis result", processedMetadata);

  return {
    ...scan,
    CODE_ANALYSIS_MASVS: processedMetadata,
    CODE_ANALYSIS_CWE: processedMetadata,
    CODE_ANALYSIS_OWASP: processedMetadata,
  };
}

export function parseDomains(scan) {
  console.log("Raw DOMAINS data:", scan.DOMAINS);
  const domains = safePythonDictParse(scan.DOMAINS, {}, "DOMAINS");
  console.log("Parsed DOMAINS data:", domains);

  const domainArray = Object.entries(domains).map(([domain, details]) => ({
    domain,
    ip: details.geolocation?.ip || "N/A",
    country: details.geolocation?.country_long || "N/A",
  }));

  console.log("Processed DOMAINS array:", domainArray);
  return { ...scan, DOMAINS: domainArray };
}

export function parseMalwarePermissions(scan) {
  console.log("logging the malware permissions:", scan);
  const malwarePermissions = safeJSONParse(
    scan.MALWARE_PERMISSIONS,
    { top_malware_permissions: [], other_abused_permissions: [] },
    "MALWARE_PERMISSIONS"
  );
  return {
    ...scan,
    TOP_MALWARE_PERMISSIONS: malwarePermissions.top_malware_permissions.join(", "),
    OTHER_ABUSED_PERMISSIONS: malwarePermissions.other_abused_permissions.join(", "),
  };
}

export function parsePermissions(scan) {
  console.log("logging the permissions:", scan.PERMISSIONS);

  if (typeof scan.PERMISSIONS === "string" && scan.PERMISSIONS.includes("<strong>")) {
    return { ...scan, PERMISSIONS: scan.PERMISSIONS };
  }

  const permissionsData = safeJSONParse(scan.PERMISSIONS, {}, "PERMISSIONS");

  const permissionsArray = Object.entries(permissionsData).map(
    ([permission, details]) => ({
      permission,
      status: details.status || "N/A",
      info: details.info || "N/A",
      description: details.description || "N/A",
    })
  );
  console.log("logging the permissions array:", permissionsArray);

  return { ...scan, PERMISSIONS: permissionsArray };
}

export function parseTrackers(scan) {
  const trackers = safeJSONParse(
    scan.TRACKERS,
    { trackers: [], detected_trackers: "N/A", total_trackers: "N/A" },
    "TRACKERS"
  );
  const trackerDetails = trackers.trackers.map((tracker) => ({
    name: tracker.name,
    categories: tracker.categories,
    url: tracker.url,
  }));
  return {
    ...scan,
    TRACKER_DETAILS: trackerDetails,
    DETECTED_TRACKERS: trackers.detected_trackers,
    TOTAL_TRACKERS: trackers.total_trackers,
  };
}

export function parseExportedCount(scan) {
  const exportedCount = safeJSONParse(
    scan.EXPORTED_COUNT,
    {
      exported_activities: "N/A",
      exported_services: "N/A",
      exported_receivers: "N/A",
      exported_providers: "N/A",
    },
    "EXPORTED_COUNT"
  );
  return {
    ...scan,
    EXPORTED_ACTIVITIES: exportedCount.exported_activities,
    EXPORTED_SERVICES: exportedCount.exported_services,
    EXPORTED_RECEIVERS: exportedCount.exported_receivers,
    EXPORTED_PROVIDERS: exportedCount.exported_providers,
  };
}

export function parseNetworkSecurity(scan) {
  const networkSecurity = safeJSONParse(
    scan.NETWORK_SECURITY,
    { network_findings: [], network_summary: {} },
    "NETWORK_SECURITY"
  );
  const networkFindings = networkSecurity.network_findings
    .map((finding) => `${finding.description} (Severity: ${finding.severity})`)
    .join("<br>");
  return {
    ...scan,
    NETWORK_FINDINGS: networkFindings,
    NETWORK_SUMMARY: `High: ${networkSecurity.network_summary.high || "N/A"}, Warning: ${networkSecurity.network_summary.warning || "N/A"}, Info: ${networkSecurity.network_summary.info || "N/A"}, Secure: ${networkSecurity.network_summary.secure || "N/A"}`,
  };
}

export function sortDataByVersion(data) {
  return data.sort((a, b) => {
    const versionA = a.VERSION_NAME.split(".").map(Number);
    const versionB = b.VERSION_NAME.split(".").map(Number);
    for (let i = 0; i < Math.max(versionA.length, versionB.length); i++) {
      if ((versionA[i] || 0) < (versionB[i] || 0)) return -1;
      if ((versionA[i] || 0) > (versionB[i] || 0)) return 1;
    }
    return 0;
  });
}