const PESU_ACADEMY_URL = "https://www.pesuacademy.com/Academy/";

// --- Helper Functions ---
function getCurrentDateString() {
  return new Date().toISOString().split("T")[0]; // YYYY-MM-DD format
}

function isStudyPage(url) {
  if (!url) return false;
  // Only track time on actual topic pages or direct PDF views
  return (
    url.includes("studentProfilePESU") ||
    url.includes("referenceMeterials/downloadslidecoursoc")
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
      }); // Reset start for next interval
    }
  }
});

// CORRECTED onUpdated listener
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab?.url) {
    // Check tab.url exists
    if (isStudyPage(tab.url)) {
      chrome.storage.local.set({ sessionStart: Date.now() });
      try {
        const results = await chrome.scripting.executeScript({
          target: { tabId: tabId },
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
          chrome.tabs
            .sendMessage(tabId, { action: "showTopicSavedNotification" })
            .catch((e) =>
              console.log("Error sending notification message:", e)
            ); // Added catch
        }
      } catch (error) {
        console.log("Could not process this page.", error.message);
      }
    } else {
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
          sessionStart: null,
        });
      }
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
        const subjects = results?.[0]?.result;
        if (subjects && subjects.length > 0) {
          const { progressData } = await chrome.storage.local.get({
            progressData: {},
          });
          let updated = false;
          for (const subject of subjects) {
            if (!progressData[subject]) {
              updated = true;
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
          if (updated) {
            await chrome.storage.local.set({ progressData });
          }
          // Always send syncComplete to update dashboard UI even if no new subjects added
          const [dashboardTab] = await chrome.tabs.query({
            url: chrome.runtime.getURL("dashboard.html"),
          });
          if (dashboardTab) {
            chrome.tabs.sendMessage(dashboardTab.id, {
              action: "syncComplete",
            });
          }
        } else {
          console.warn("PESU Helper: No subjects found on page.");
          // Optionally send a message back to dashboard to indicate failure/no subjects
        }
      } else {
        console.error(
          "PESU Helper: Could not find 'My Courses' tab. Please open it first."
        );
        // Optionally send a message back to dashboard to indicate failure
        const [dashboardTab] = await chrome.tabs.query({
          url: chrome.runtime.getURL("dashboard.html"),
        });
        if (dashboardTab) {
          chrome.tabs.sendMessage(dashboardTab.id, {
            action: "syncFailed",
            reason: "My Courses tab not found.",
          });
        }
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
        } else {
          console.error(
            "PESU Helper: Could not get PDF info from page to perform action."
          );
        }
      }
    }
  })();
  return true; // Indicate async response
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
    // Ensure tab object is valid before proceeding
    if (tab?.id) {
      try {
        const results = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          function: getPageInfo,
        });
        const pageInfo = results && results[0] ? results[0].result : null;
        if (pageInfo && pageInfo.pdfUrl) {
          openInNewTab(pageInfo.pdfUrl);
        } else {
          console.error(
            "PESU Helper: Could not get PDF info for context menu action."
          );
        }
      } catch (error) {
        console.error(
          "PESU Helper: Error executing script from context menu:",
          error
        );
      }
    } else {
      console.error(
        "PESU Helper: Invalid tab object received from context menu click."
      );
    }
  }
});
