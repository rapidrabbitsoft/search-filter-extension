const predefinedNews = [
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

const predefinedContainer = document.getElementById("predefinedNews");
const customContainer = document.getElementById("customNews");
const newNewsInput = document.getElementById("newNews");
const addBtn = document.getElementById("addNews");
const toggleBtn = document.getElementById("toggleExtension");
const predefinedToggle = document.getElementById("predefinedToggle");
const customToggle = document.getElementById("customToggle");

document.addEventListener("DOMContentLoaded", () => {
  addBtn.onclick = () => {
    const word = newNewsInput.value.trim();
    if (!word) return;

    chrome.storage.local.get(["customNews", "predefinedStates"], (data = {}) => {
      const customNews = data.customNews || [];
      const predefinedStates = data.predefinedStates || [];
      customNews.push({ word, enabled: true });
      chrome.storage.local.set({ customNews }, () => {
        renderNews(predefinedStates || {}, customNews);
        syncWithPredefinedStates(predefinedStates);
        syncWithCustomState(customNews);
        updateSearchQueryLive();
      });
      newNewsInput.value = "";
    });
  };

  chrome.storage.local.get(["predefinedToggleState", "customToggleState"], (data = {}) => {
    const predefinedToggleState = data.predefinedToggleState || false;
    const customToggleState = data.customToggleState || false;
    predefinedToggle.checked = predefinedToggleState;
    customToggle.checked = customToggleState;
  });

  newNewsInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addBtn.click();
    }
  });

  chrome.storage.local.get(["predefinedStates", "customNews", "extensionEnabled"], (data = {}) => {
    const state = data.predefinedStates || {};
    predefinedNews.forEach(([value]) => {
      if (typeof state[value] !== "boolean") {
        state[value] = false;
      }
    });

    chrome.storage.local.set({ predefinedStates: state }, () => {
      renderNews(state, data.customNews || []);
    });

    const enabled = data.extensionEnabled !== false;
    toggleBtn.textContent = enabled ? "✅ Enabled" : "❌ Disabled";
    toggleBtn.dataset.enabled = enabled;
  });

  toggleBtn.onclick = () => {
    const currentState = toggleBtn.dataset.enabled === "true";
    const newState = !currentState;

    chrome.storage.local.set({ extensionEnabled: newState }, () => {
      toggleBtn.textContent = newState ? "✅ Enabled" : "❌ Disabled";
      toggleBtn.dataset.enabled = newState;
    });
  };

  predefinedToggle.addEventListener("change", () => {
    chrome.storage.local.get("extensionEnabled", (data) => {
      const isEnabled = data.extensionEnabled !== false;
      if (!isEnabled) return;

      const newState = predefinedToggle.checked;
      chrome.storage.local.set({ predefinedToggleState: newState });

      chrome.storage.local.get(["predefinedStates", "customNews"], (data) => {
        const customNews = data.customNews;
        const predefinedStates = data.predefinedStates || {};
        for (const [key] of predefinedNews) {
          predefinedStates[key] = newState;
        }

        chrome.storage.local.set({ predefinedStates }, () => {
          renderNews(predefinedStates, customNews);
          syncWithPredefinedStates(predefinedStates);
          syncWithCustomState(customNews);
          updateSearchQueryLive();
        });
      });
    });
  });

  customToggle.addEventListener("change", () => {
    chrome.storage.local.get("extensionEnabled", (data) => {
      const isEnabled = data.extensionEnabled !== false;
      if (!isEnabled) return;

      const newState = customToggle.checked;

      chrome.storage.local.set({ customToggleState: newState });
      chrome.storage.local.get(["predefinedStates", "customStates", "customNews"], (data) => {
        const customNews = data.customNews;
        for (const item of customNews) {
          item.enabled = newState;
        }

        chrome.storage.local.set({ customNews }, () => {
          renderNews(data.predefinedStates, customNews);
          updateSearchQueryLive();
        });
      });
    });
  });

});

function predefinedToggleState(predefinedStates) {
  const allChecked = Object.values(predefinedStates).every(v => v === true);
  predefinedToggle.checked = allChecked;
};

function renderNews(predefinedStates, customNews) {
  predefinedContainer.innerHTML = "";

  predefinedNews.forEach(([value, name]) => {
    const wrapper = document.createElement("div");
    wrapper.className = "form-check ps-0";


    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "form-check-input";
    checkbox.id = `predef-${value}`;
    checkbox.checked = !!predefinedStates[value];
    checkbox.addEventListener("change", () => {
      predefinedStates[value] = checkbox.checked;
      chrome.storage.local.set({ predefinedStates });
      syncWithPredefinedStates(predefinedStates);
      syncWithCustomState(customNews);
      updateSearchQueryLive();
    });

    const label = document.createElement("label");
    label.className = "form-check-label";
    label.setAttribute("for", checkbox.id);
    label.textContent = name;

    wrapper.appendChild(checkbox);
    wrapper.appendChild(label);
    predefinedContainer.appendChild(wrapper);
  });

  customContainer.innerHTML = "";
  if (Array.isArray(customNews)) {
    customNews.forEach((obj, index) => {
      const container = document.createElement("div");
      container.className = "custom-news";

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.className = "form-check-input";
      checkbox.checked = obj.enabled;
      checkbox.addEventListener("change", () => {
        customNews[index].enabled = checkbox.checked;
        chrome.storage.local.set({ customNews });
        syncWithPredefinedStates(predefinedStates);
        syncWithCustomState(customNews);
        updateSearchQueryLive();
      });

      const wordSpan = document.createElement("span");
      wordSpan.textContent = obj.word;

      const removeBtn = document.createElement("button");
      removeBtn.textContent = "x";
      removeBtn.className = "btn btn-sm text-danger m-0 p-0";
      removeBtn.onclick = () => {
        customNews.splice(index, 1);
        chrome.storage.local.set({ customNews }, () => {
          renderNews(predefinedStates, customNews);
          syncWithPredefinedStates(predefinedStates);
          syncWithCustomState(customNews);
          updateSearchQueryLive();
        });
      };
      container.appendChild(checkbox);
      container.appendChild(wordSpan);
      container.appendChild(removeBtn);
      customContainer.appendChild(container);
    });
  };
}

function syncWithPredefinedStates(predefinedStates) {
  const allChecked = Object.values(predefinedStates).every(v => v === true);
  predefinedToggle.checked = allChecked;
  chrome.storage.local.set({ predefinedToggleState: allChecked });
}

function syncWithCustomState(customNews) {
  const allChecked = customNews.every(item => item.enabled);
  customToggle.checked = allChecked;
  chrome.storage.local.set({ customToggleState: allChecked });
}

function updateSearchQueryLive() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tabId = tabs[0].id;

    chrome.scripting.executeScript({
      target: { tabId },
      func: () => {
        chrome.storage.local.get(["predefinedStates", "customNews", "extensionEnabled"], (data) => {
          if (data.extensionEnabled === false) return;

          const urlParams = new URLSearchParams(window.location.search);
          let q = urlParams.get("q");
          if (!q) return;

          const cleanedQuery = q
            .split(/\s+/)
            .filter(part => !part.startsWith("-") && !/^-[^\s]+/.test(part))
            .join(" ");

          let excludedTerms = [];

          const predefined = data.predefinedStates || {};
          for (const [domain, enabled] of Object.entries(predefined)) {
            if (enabled) excludedTerms.push(`-${domain}`);
          }

          const custom = data.customNews || [];
          for (const { word, enabled } of custom) {
            if (enabled) excludedTerms.push(`-${word}`);
          }

          const newQuery = `${cleanedQuery} ${excludedTerms.join(" ")}`.trim();
          urlParams.set("q", newQuery);
          window.location.search = urlParams.toString();
        });
      }
    });
  });
}
