// Utility function to handle storage operations
const storage = {
  get: (keys) => new Promise((resolve) => chrome.storage.local.get(keys, resolve))
};

// Main function to update search query
const updateSearchQuery = async () => {
  try {
    const data = await storage.get(["extensionEnabled", "predefinedStates", "customNews"]);
    if (data.extensionEnabled === false) return;

    const urlParams = new URLSearchParams(window.location.search);
    const q = urlParams.get("q");
    if (!q) return;

    const excludedTerms = [];

    // Add predefined exclusions
    const predefined = data.predefinedStates || {};
    Object.entries(predefined)
      .filter(([, enabled]) => enabled)
      .forEach(([domain]) => excludedTerms.push(`-${domain}`));

    // Add custom exclusions
    const custom = data.customNews || [];
    custom
      .filter(({ enabled }) => enabled)
      .forEach(({ word }) => excludedTerms.push(`-${word}`));

    // Update URL if needed
    const alreadyExcluded = excludedTerms.every(term => q.includes(term));
    if (!alreadyExcluded && excludedTerms.length) {
      const newQuery = `${q} ${excludedTerms.join(" ")}`.trim();
      urlParams.set("q", newQuery);
      window.location.search = urlParams.toString();
    }
  } catch (error) {
    console.error("Error updating search query:", error);
  }
};

// Initialize
updateSearchQuery();
