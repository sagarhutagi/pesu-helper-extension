// --- Helper Functions ---
function createNotificationToast() {
  let toast = document.getElementById("pesu-helper-toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "pesu-helper-toast";
    toast.textContent = "✅ Topic Saved";
    document.body.appendChild(toast);
  }
  return toast;
}

function showTopicSavedNotification(toastElement) {
  toastElement.classList.add("show");
  setTimeout(() => {
    toastElement.classList.remove("show");
  }, 3000);
}

// --- Button Injection Logic ---
function injectPdfButtons(clickedLink) {
  const container = clickedLink.closest(".link-preview");
  if (!container || container.querySelector(".pesu-helper-button-container"))
    return; // Don't add buttons if they already exist

  const buttonContainer = document.createElement("div");
  buttonContainer.className = "pesu-helper-button-container";
  buttonContainer.innerHTML = `
        <button class="pesu-helper-btn" title="Open in New Tab" data-action="openPdfInNewTab">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
        </button>
        <button class="pesu-helper-btn" title="Download PDF" data-action="downloadPdf">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
        </button>
    `;
  container.appendChild(buttonContainer);
}

function injectDownloadAllButton() {
  const targetHeader = document.querySelector(".course_title_btns");
  if (
    targetHeader &&
    !document.getElementById("pesu-helper-download-all-btn")
  ) {
    const downloadAllButton = document.createElement("button");
    downloadAllButton.id = "pesu-helper-download-all-btn";
    downloadAllButton.className = "pesu-helper-btn large"; // Larger button style
    downloadAllButton.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            <span>Download All Materials</span>
        `;
    targetHeader.appendChild(downloadAllButton);
    downloadAllButton.addEventListener("click", handleDownloadAll);
  }
}

// --- Scraper & Handler Logic ---
function handleDownloadAll() {
  const btn = document.getElementById("pesu-helper-download-all-btn");
  btn.textContent = "Scanning...";
  btn.disabled = true;

  const materials = [];
  let currentUnit = "Unit_1";
  let subjectName =
    document
      .querySelector(".cmc_breadcrum a:last-of-type")
      ?.textContent.trim()
      .split(":")[1]
      ?.trim() || "Unknown Subject";

  document
    .querySelectorAll(".panel-title, .link-preview")
    .forEach((element) => {
      if (element.classList.contains("panel-title")) {
        const unitText = element.textContent.trim();
        if (unitText.toLowerCase().includes("unit")) {
          currentUnit = unitText.replace(/\s+/g, "_");
        }
      } else if (element.classList.contains("link-preview")) {
        const link = element.querySelector('a[onclick*="loadIframe"]');
        if (link) {
          let topicName = link.textContent.trim();
          const onclickAttr = link.getAttribute("onclick");
          const urlMatch = onclickAttr.match(/'(.*?)'/);
          if (urlMatch && urlMatch[1]) {
            const partialUrl = urlMatch[1].split("#")[0];
            const fullUrl = `https://www.pesuacademy.com${partialUrl}.pdf`;
            let docType = "Slides";
            if (topicName.toLowerCase().includes("assignment"))
              docType = "Assignments";
            if (
              topicName.toLowerCase().includes("qa") ||
              topicName.toLowerCase().includes("question")
            )
              docType = "Question_Papers";

            materials.push({
              subject: subjectName.replace(/[\\/:*?"<>|]/g, ""),
              unit: currentUnit,
              type: docType,
              filename: topicName.replace(/[\\/:*?"<>|]/g, ""),
              url: fullUrl,
            });
          }
        }
      }
    });

  if (materials.length > 0) {
    chrome.runtime.sendMessage({
      action: "downloadAllMaterials",
      materials: materials,
    });
    btn.textContent = `Downloading ${materials.length} files...`;
  } else {
    btn.textContent = "No materials found.";
  }
}

// --- Main Execution ---
// Only run the main logic in the top-level page, not inside nested iframes.
if (window.self === window.top) {
  const toast = createNotificationToast();
  chrome.runtime.onMessage.addListener((request) => {
    if (request.action === "showTopicSavedNotification") {
      showTopicSavedNotification(toast);
    }
  });

  // Main click listener to handle everything.
  document.addEventListener(
    "click",
    (event) => {
      // Handle clicks on PDF topic links.
      const pdfLink = event.target.closest(
        '.link-preview a[onclick*="loadIframe"]'
      );
      if (pdfLink) {
        injectPdfButtons(pdfLink);
        // Immediately tell the background to save the topic. This is reliable.
        chrome.runtime.sendMessage({ action: "saveTopicOnDemand" });
      }

      // Handle clicks on our injected buttons.
      const button = event.target.closest(".pesu-helper-btn");
      if (button && button.dataset.action) {
        event.stopPropagation();
        chrome.runtime.sendMessage({ action: button.dataset.action });
      }
    },
    true
  );

  // Observer to detect when the user navigates between sections (like to a course page).
  const observer = new MutationObserver(() => {
    // Check if the "Download All" button should be visible.
    if (document.querySelector(".course_title_btns")) {
      injectDownloadAllButton();
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
}
