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

// **THIS IS THE MISSING FUNCTION**
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
function openInNewTab(url) {
  chrome.tabs.create({ url: url });
}
function downloadDirectly(url, filename) {
  chrome.downloads.download({ url: url, filename: filename });
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
    const tabs = await chrome.tabs.query({
      url: [
        "*://*.pesuacademy.com/Academy/s/studentProfilePESU*",
        "*://*.pesuacademy.com/Academy/a/referenceMeterials/downloadslidecoursedoc/*",
      ],
    });
    if (tabs.length > 0) {
      const { timeData } = await chrome.storage.local.get({ timeData: {} });
      const today = getCurrentDateString();
      timeData[today] = (timeData[today] || 0) + 60;
      await chrome.storage.local.set({ timeData });
    }
  }
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && isStudyPage(tab.url)) {
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
        chrome.tabs.sendMessage(tabId, {
          action: "showTopicSavedNotification",
        });
      }
    } catch (error) {
      console.log("Could not process this page.", error.message);
    }
  }
});

chrome.runtime.onMessage.addListener((request, sender) => {
  (async () => {
    if (request.action === "syncSubjectsFromPage") {
      const [tab] = await chrome.tabs.query({
        url: "*://*.pesuacademy.com/Academy/s/studentProfile*",
      });
      if (tab) {
        const results = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          function: scrapeCoursesFunc,
        });
        const subjects = results[0].result;
        if (subjects && subjects.length > 0) {
          const { progressData } = await chrome.storage.local.get({
            progressData: {},
          });
          for (const subject of subjects) {
            if (!progressData[subject]) {
              progressData[subject] = {};
              for (let i = 1; i <= 4; i++) {
                progressData[subject][`Unit ${i}`] = {
                  theory: false,
                  numericals: false,
                  revision1: false,
                  revision2: false,
                };
              }
            }
          }
          await chrome.storage.local.set({ progressData });
          const [dashboardTab] = await chrome.tabs.query({
            url: chrome.runtime.getURL("dashboard.html"),
          });
          if (dashboardTab) {
            chrome.tabs.sendMessage(dashboardTab.id, {
              action: "syncComplete",
            });
          }
        }
      } else {
        console.error("Could not find 'My Courses' tab.");
      }
    } else if (request.action === "openLogin") {
      await chrome.tabs.create({ url: PESU_ACADEMY_URL });
    } else if (
      request.action === "openPdfInNewTab" ||
      request.action === "downloadPdf"
    ) {
      const tab = sender.tab;
      if (tab) {
        const results = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          function: getPageInfo,
        });
        const pageInfo = results && results[0] ? results[0].result : null;
        if (pageInfo && pageInfo.pdfUrl) {
          if (request.action === "downloadPdf") {
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
      openInNewTab(pageInfo.pdfUrl);
    }
  }
});
