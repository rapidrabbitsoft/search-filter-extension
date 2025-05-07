chrome.storage.local.get("extensionEnabled", (data) => {
  const isEnabled = data.extensionEnabled !== false;
  if (!isEnabled) return;

  chrome.storage.local.get(["predefinedStates", "customNews"], (data) => {
    const urlParams = new URLSearchParams(window.location.search);
    const q = urlParams.get("q");
    if (!q) return;

    let excludedTerms = [];

    // Only include checked predefined items
    const predefined = data.predefinedStates || {};
    for (const [domain, enabled] of Object.entries(predefined)) {
      if (enabled) {
        excludedTerms.push(`-${domain}`);
      }
    }

    // Only include checked custom items
    const custom = data.customNews || [];
    for (const { word, enabled } of custom) {
      if (enabled) {
        excludedTerms.push(`-${word}`);
      }
    }

    // Avoid duplicate queries
    const alreadyExcluded = excludedTerms.every(term => q.includes(term));
    if (!alreadyExcluded && excludedTerms.length) {
      const newQuery = `${q} ${excludedTerms.join(" ")}`.trim();
      urlParams.set("q", newQuery);
      window.location.search = urlParams.toString();
    }
  });
});
