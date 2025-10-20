const PESU_ACADEMY_URL = "https://www.pesuacademy.com/Academy/";

// --- Helper Functions ---
function getCurrentDateString() {
  const today = new Date();
  return today.toISOString().split("T")[0]; // YYYY-MM-DD format
}

// This function gets injected into a PESU page to find info.
function getPageInfo() {
  const info = {
    pdfUrl: null,
    filename: "download.pdf",
    subject: null,
    topic: null,
  };
  try {
    const iframe = document.querySelector('iframe[src*="referenceMeterials"]');
    if (iframe && iframe.src) {
      info.pdfUrl = iframe.src.split("#")[0] + ".pdf";
    }

    const breadcrumbDiv = document.querySelector(".cmc_breadcrum");
    if (breadcrumbDiv) {
      const subjectElement = breadcrumbDiv.querySelector("a:nth-of-type(2)");
      if (subjectElement && subjectElement.textContent) {
        const subjectParts = subjectElement.textContent.trim().split(":");
        info.subject = (subjectParts[1] || subjectParts[0]).trim();
      }

      const childNodes = breadcrumbDiv.childNodes;
      for (let i = childNodes.length - 1; i >= 0; i--) {
        const node = childNodes[i];
        if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
          const topicName = node.textContent.trim();
          info.topic = topicName;
          info.filename = `${topicName.replace(/[\\/:*?"<>|]/g, "")}.pdf`;
          break;
        }
      }
    }
  } catch (error) {
    console.error("Error getting page info:", error);
  }
  return info;
}

// --- Action Functions ---
function openInNewTab(url) {
  chrome.tabs.create({ url: url });
}
function downloadDirectly(url, filename) {
  chrome.downloads.download({ url: url, filename: filename });
}

// --- Main Logic to Handle PDF Actions ---
async function handlePdfAction(tab) {
  const results = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: getPageInfo,
  });
  const pageInfo = results && results[0] ? results[0].result : null;

  if (pageInfo && pageInfo.pdfUrl) {
    const action = await new Promise((resolve) =>
      chrome.runtime.sendMessage({ action: "getAction" }, resolve)
    );
    if (action === "download") {
      downloadDirectly(pageInfo.pdfUrl, pageInfo.filename);
    } else {
      openInNewTab(pageInfo.pdfUrl);
    }
  }
}

// --- Event Listeners ---
chrome.tabs.onActivated.addListener((activeInfo) => {
  chrome.tabs.get(activeInfo.tabId, (tab) => {
    if (tab && tab.url && tab.url.includes("pesuacademy.com")) {
      chrome.storage.local.set({ sessionStart: Date.now() });
    } else {
      chrome.storage.local.get({ sessionStart: null, timeData: {} }, (data) => {
        if (data.sessionStart) {
          const duration = Math.round((Date.now() - data.sessionStart) / 1000);
          const today = getCurrentDateString();
          data.timeData[today] = (data.timeData[today] || 0) + duration;
          chrome.storage.local.set({
            timeData: data.timeData,
            sessionStart: null,
          });
        }
      });
    }
  });
});

chrome.alarms.create("timeSaver", { delayInMinutes: 1, periodInMinutes: 1 });
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === "timeSaver") {
    const { sessionStart, timeData } = await chrome.storage.local.get({
      sessionStart: null,
      timeData: {},
    });
    if (sessionStart) {
      const duration = Math.round((Date.now() - sessionStart) / 1000);
      const today = getCurrentDateString();
      timeData[today] = (timeData[today] || 0) + duration;
      await chrome.storage.local.set({
        timeData: timeData,
        sessionStart: Date.now(),
      });
    }
  }
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (
    changeInfo.status === "complete" &&
    tab.url &&
    tab.url.includes("pesuacademy.com/Academy/s/studentProfilePESU")
  ) {
    try {
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: getPageInfo,
      });
      const pageInfo = results && results[0] ? results[0].result : null;

      if (pageInfo && pageInfo.subject && pageInfo.topic && pageInfo.pdfUrl) {
        const { lastReadTopics } = await chrome.storage.local.get({
          lastReadTopics: {},
        });
        lastReadTopics[pageInfo.subject] = {
          topic: pageInfo.topic,
          url: tab.url,
          pdfUrl: pageInfo.pdfUrl,
          subject: pageInfo.subject,
        };
        await chrome.storage.local.set({ lastReadTopics });
      }
    } catch (error) {
      console.log("Could not process this page.", error.message);
    }
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  (async () => {
    if (request.action === "openLogin") {
      await chrome.tabs.create({ url: PESU_ACADEMY_URL });
    } else if (request.action) {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      if (tab) {
        // Simplified handlePdfAction call
        const results = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          function: getPageInfo,
        });
        const pageInfo = results && results[0] ? results[0].result : null;
        if (pageInfo && pageInfo.pdfUrl) {
          if (request.action === "download") {
            downloadDirectly(pageInfo.pdfUrl, pageInfo.filename);
          } else {
            openInNewTab(pageInfo.pdfUrl);
          }
        }
      }
    }
  })();
  return true;
});

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "pesuPdfHelper",
    title: "Open PDF with Helper",
    contexts: ["page"],
    documentUrlPatterns: ["*://*.pesuacademy.com/*"],
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "pesuPdfHelper") {
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: getPageInfo,
    });
    const pageInfo = results && results[0] ? results[0].result : null;
    if (pageInfo && pageInfo.pdfUrl) {
      openInNewTab(pageInfo.pdfUrl); // Default is always new tab
    }
  }
});
