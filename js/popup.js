// Constants
const PREDEFINED_NEWS = [
  ["aljazeera.com", "Al Jazeera"],
  ["apnews.com", "Associated Press"],
  ["bbc.com", "BBC News"],
  ["bloomberg.com", "Bloomberg"],
  ["cbsnews.com", "CBS News"],
  ["cnn.com", "CNN"],
  ["foxnews.com", "Fox News"],
  ["independent.co.uk", "The Independent"],
  ["nbcnews.com", "NBC News"],
  ["nytimes.com", "The New York Times"],
  ["reuters.com", "Reuters"],
  ["sky.com", "Sky News"],
  ["theguardian.com", "The Guardian"],
  ["usatoday.com", "USA Today"],
  ["washingtonpost.com", "The Washington Post"],
  ["wsj.com", "The Wall Street Journal"]
];

// DOM Elements
const elements = {
  predefinedContainer: document.getElementById("predefinedNews"),
  customContainer: document.getElementById("customNews"),
  newNewsInput: document.getElementById("newNews"),
  addBtn: document.getElementById("addNews"),
  toggleBtn: document.getElementById("toggleExtension"),
  predefinedToggle: document.getElementById("predefinedToggle"),
  customToggle: document.getElementById("customToggle")
};

// Utility Functions
const storage = {
  get: (keys) => new Promise((resolve) => chrome.storage.local.get(keys, resolve)),
  set: (data) => new Promise((resolve) => chrome.storage.local.set(data, resolve))
};

const updateUI = async () => {
  const data = await storage.get(["predefinedStates", "customNews", "extensionEnabled"]);
  const state = data.predefinedStates || {};
  
  // Initialize predefined states
  PREDEFINED_NEWS.forEach(([value]) => {
    if (typeof state[value] !== "boolean") {
      state[value] = false;
    }
  });

  await storage.set({ predefinedStates: state });
  renderNews(state, data.customNews || []);

  const enabled = data.extensionEnabled !== false;
  elements.toggleBtn.textContent = enabled ? "✅ Enabled" : "❌ Disabled";
  elements.toggleBtn.dataset.enabled = enabled;
};

const renderNews = (predefinedStates, customNews) => {
  // Render predefined news
  elements.predefinedContainer.innerHTML = "";
  PREDEFINED_NEWS.forEach(([value, name]) => {
    const wrapper = document.createElement("div");
    wrapper.className = "form-check ps-0";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "form-check-input";
    checkbox.id = `predef-${value}`;
    checkbox.checked = !!predefinedStates[value];
    checkbox.addEventListener("change", async () => {
      predefinedStates[value] = checkbox.checked;
      await storage.set({ predefinedStates });
      await updateSearchQueryLive();
    });

    const label = document.createElement("label");
    label.className = "form-check-label";
    label.setAttribute("for", checkbox.id);
    label.textContent = name;

    wrapper.append(checkbox, label);
    elements.predefinedContainer.appendChild(wrapper);
  });

  // Render custom news
  elements.customContainer.innerHTML = "";
  if (Array.isArray(customNews)) {
    customNews.forEach((obj, index) => {
      const container = document.createElement("div");
      container.className = "custom-news";

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.className = "form-check-input";
      checkbox.checked = obj.enabled;
      checkbox.addEventListener("change", async () => {
        customNews[index].enabled = checkbox.checked;
        await storage.set({ customNews });
        await updateSearchQueryLive();
      });

      const wordSpan = document.createElement("span");
      wordSpan.textContent = obj.word;

      const removeBtn = document.createElement("button");
      removeBtn.textContent = "×";
      removeBtn.className = "btn btn-sm text-danger m-0 p-0";
      removeBtn.onclick = async () => {
        customNews.splice(index, 1);
        await storage.set({ customNews });
        renderNews(predefinedStates, customNews);
        await updateSearchQueryLive();
      };

      container.append(checkbox, wordSpan, removeBtn);
      elements.customContainer.appendChild(container);
    });
  }
};

const updateSearchQueryLive = async () => {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tabs.length) return;

  const tabId = tabs[0].id;
  await chrome.scripting.executeScript({
    target: { tabId },
    func: async () => {
      const data = await chrome.storage.local.get(["predefinedStates", "customNews", "extensionEnabled"]);
      if (data.extensionEnabled === false) return;

      const urlParams = new URLSearchParams(window.location.search);
      const q = urlParams.get("q");
      if (!q) return;

      const cleanedQuery = q
        .split(/\s+/)
        .filter(part => !part.startsWith("-") && !/^-[^\s]+/.test(part))
        .join(" ");

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
        const newQuery = `${cleanedQuery} ${excludedTerms.join(" ")}`.trim();
        urlParams.set("q", newQuery);
        window.location.search = urlParams.toString();
      }
    }
  });
};

// Event Listeners
document.addEventListener("DOMContentLoaded", async () => {
  // Initialize UI
  await updateUI();

  // Add news handler
  elements.addBtn.onclick = async () => {
    const word = elements.newNewsInput.value.trim();
    if (!word) return;

    const data = await storage.get(["customNews", "predefinedStates"]);
    const customNews = data.customNews || [];
    customNews.push({ word, enabled: true });
    
    await storage.set({ customNews });
    renderNews(data.predefinedStates || {}, customNews);
    await updateSearchQueryLive();
    elements.newNewsInput.value = "";
  };

  // Enter key handler
  elements.newNewsInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      elements.addBtn.click();
    }
  });

  // Toggle extension handler
  elements.toggleBtn.onclick = async () => {
    const currentState = elements.toggleBtn.dataset.enabled === "true";
    const newState = !currentState;
    
    await storage.set({ extensionEnabled: newState });
    elements.toggleBtn.textContent = newState ? "✅ Enabled" : "❌ Disabled";
    elements.toggleBtn.dataset.enabled = newState;
  };

  // Predefined toggle handler
  elements.predefinedToggle.addEventListener("change", async () => {
    const data = await storage.get(["extensionEnabled", "predefinedStates", "customNews"]);
    if (data.extensionEnabled === false) return;

    const newState = elements.predefinedToggle.checked;
    await storage.set({ predefinedToggleState: newState });

    const predefinedStates = data.predefinedStates || {};
    PREDEFINED_NEWS.forEach(([key]) => {
      predefinedStates[key] = newState;
    });

    await storage.set({ predefinedStates });
    renderNews(predefinedStates, data.customNews);
    await updateSearchQueryLive();
  });

  // Custom toggle handler
  elements.customToggle.addEventListener("change", async () => {
    const data = await storage.get(["extensionEnabled", "customNews"]);
    if (data.extensionEnabled === false) return;

    const newState = elements.customToggle.checked;
    await storage.set({ customToggleState: newState });

    const customNews = data.customNews || [];
    customNews.forEach(item => item.enabled = newState);

    await storage.set({ customNews });
    renderNews(data.predefinedStates || {}, customNews);
    await updateSearchQueryLive();
  });
});
