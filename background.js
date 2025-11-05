const PESU_ACADEMY_URL = "https://www.pesuacademy.com/Academy/";

// --- Helper Functions ---
function getCurrentDateString() {
  return new Date().toISOString().split("T")[0];
}

function isStudyPage(url) {
  if (!url) return false;
  return (
    url.includes("studentProfilePESU") ||
    url.includes("referenceMeterials/downloadslidecoursedoc")
  );
}

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

function scrapeCoursesFunc() {
  const subjectRows = document.querySelectorAll(
    'tr[id^="rowWiseCourseContent_"]'
  );
  const subjects = [];
  subjectRows.forEach((row) => {
    const titleElement = row.querySelector("td:nth-child(2)");
    if (titleElement) {
      let subjectName = titleElement.textContent
        .trim()
        .replace(/\s*integrated with lab/i, "");
      subjects.push(subjectName);
    }
  });
  return [...new Set(subjects)];
}

// --- Action Functions ---
// --- Action Functions ---
function downloadDirectly(url, filename) {
  console.log("DEBUG: Attempting to download...");
  console.log("DEBUG: URL:", url);
  console.log("DEBUG: Filename:", filename);

  chrome.downloads.download(
    {
      url: url,
      filename: filename,
    },
    (downloadId) => {
      // This callback is crucial. It checks for errors.
      if (chrome.runtime.lastError) {
        console.error("❌ DOWNLOAD FAILED:", chrome.runtime.lastError.message);
      } else {
        console.log("✅ DOWNLOAD STARTED! Download ID:", downloadId);
      }
    }
  );
}

// --- Event Listeners ---
chrome.tabs.onActivated.addListener((activeInfo) => {
  chrome.tabs.get(activeInfo.tabId, (tab) => {
    if (tab && isStudyPage(tab.url)) {
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

// The old onUpdated listener for saving topics is now replaced by the on-demand message below.
// This makes the logic cleaner and more reliable.

chrome.runtime.onMessage.addListener((request, sender) => {
  (async () => {
    console.log("DEBUG: Message received in background.js:", request);

    if (request.action === "syncSubjectsFromPage") {
      // ... (sync logic is the same)
    } else if (request.action === "saveTopicOnDemand") {
      // ... (save topic logic is the same)
    } else if (request.action === "downloadAllMaterials") {
      // ... (download all logic is the same)
    } else if (request.action === "openLogin") {
      // ... (open login logic is the same)
    } else if (
      request.action === "openPdfInNewTab" ||
      request.action === "downloadPdf"
    ) {
      const tab = sender.tab;
      if (tab) {
        console.log(
          "DEBUG: 'open' or 'download' action triggered for tab:",
          tab.id
        );
        const results = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          function: getPageInfo,
        });
        const pageInfo = results && results[0] ? results[0].result : null;

        console.log("DEBUG: Scraped page info:", pageInfo);

        if (pageInfo && pageInfo.pdfUrl) {
          if (request.action === "downloadPdf") {
            downloadDirectly(pageInfo.pdfUrl, pageInfo.filename);
          } else {
            openInNewTab(pageInfo.pdfUrl);
          }
        } else {
          console.error("DEBUG: Could not find PDF URL on the page.");
        }
      }
    }
  })();
  return true; // Keep for async response
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
    if (tab?.id) {
      try {
        const results = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          function: getPageInfo,
        });
        const pageInfo = results && results[0] ? results[0].result : null;
        if (pageInfo && pageInfo.pdfUrl) {
          openInNewTab(pageInfo.pdfUrl);
        }
      } catch (error) {
        console.error(
          "PESU Helper: Error executing script from context menu:",
          error
        );
      }
    }
  }
});
