// The main URL for PESU Academy. The site will handle login redirects.
const PESU_ACADEMY_URL = "https://www.pesuacademy.com/Academy/";

// This function gets injected into a PESU page to find PDF info.
function getPageInfo() {
  const info = { pdfUrl: null, filename: "download.pdf" };

  // 1. Get the PDF URL (this part is unchanged)
  const iframe = document.querySelector('iframe[src*="referenceMeterials"]');
  if (iframe && iframe.src) {
    info.pdfUrl = iframe.src.split("#")[0] + ".pdf";
  }

  // 2. Get the TOPIC NAME (this is the corrected logic)
  const breadcrumbDiv = document.querySelector(".cmc_breadcrum");
  if (breadcrumbDiv) {
    // The topic name is the last piece of text inside the breadcrumb div.
    // We get all child nodes and take the last one.
    const lastNode =
      breadcrumbDiv.childNodes[breadcrumbDiv.childNodes.length - 1];

    // Check if it's a text node and has actual content.
    if (
      lastNode &&
      lastNode.nodeType === Node.TEXT_NODE &&
      lastNode.textContent.trim()
    ) {
      let topicName = lastNode.textContent.trim();

      // Clean the text to make it a valid filename.
      topicName = topicName.replace(/[\\/:*?"<>|]/g, ""); // Removes invalid characters

      info.filename = `${topicName}.pdf`;
    }
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
async function handlePdfAction(tab, actionOverride) {
  const { preferredBehavior } = await chrome.storage.sync.get({
    preferredBehavior: "newTab",
  });
  const actionToPerform = actionOverride || preferredBehavior;
  const results = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: getPageInfo,
  });
  const pageInfo = results && results[0] ? results[0].result : null;

  if (pageInfo && pageInfo.pdfUrl) {
    if (actionToPerform === "download") {
      downloadDirectly(pageInfo.pdfUrl, pageInfo.filename);
    } else {
      openInNewTab(pageInfo.pdfUrl);
    }
  } else {
    console.error("PESU Helper: No PDF iframe found on this page.");
  }
}

// --- Event Listeners ---
chrome.runtime.onMessage.addListener((request) => {
  (async () => {
    if (request.action === "openLogin") {
      await chrome.tabs.create({ url: PESU_ACADEMY_URL });
    } else if (request.action) {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      if (tab && tab.url.startsWith("http")) {
        await handlePdfAction(tab, request.action);
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

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "pesuPdfHelper") {
    handlePdfAction(tab, null);
  }
});
