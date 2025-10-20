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

function injectPdfButtons(clickedLink) {
  const container = clickedLink.closest(".link-preview");
  if (!container || container.querySelector(".pesu-helper-button-container")) {
    return;
  }
  const buttonContainer = document.createElement("div");
  buttonContainer.className = "pesu-helper-button-container";
  buttonContainer.innerHTML = `
        <button id="pesu-helper-open-btn" class="pesu-helper-btn" title="Open in New Tab">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
        </button>
        <button id="pesu-helper-download-btn" class="pesu-helper-btn" title="Download PDF">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
        </button>
    `;
  container.appendChild(buttonContainer);

  buttonContainer
    .querySelector("#pesu-helper-open-btn")
    .addEventListener("click", (e) => {
      e.stopPropagation();
      chrome.runtime.sendMessage({ action: "openPdfInNewTab" });
    });
  buttonContainer
    .querySelector("#pesu-helper-download-btn")
    .addEventListener("click", (e) => {
      e.stopPropagation();
      chrome.runtime.sendMessage({ action: "downloadPdf" });
    });
}

const toast = createNotificationToast();
chrome.runtime.onMessage.addListener((request) => {
  if (request.action === "showTopicSavedNotification") {
    showTopicSavedNotification(toast);
  }
});

document.addEventListener(
  "click",
  (event) => {
    const clickedLink = event.target.closest(
      '.link-preview a[onclick*="loadIframe"]'
    );
    if (clickedLink) {
      injectPdfButtons(clickedLink);
    }
  },
  true
);
