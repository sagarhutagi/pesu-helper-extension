document.addEventListener("DOMContentLoaded", () => {
  // Check the URL of the active tab to decide which menu to show.
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const currentTab = tabs[0];
    if (
      currentTab &&
      currentTab.url &&
      currentTab.url.includes("pesuacademy.com")
    ) {
      // Show the PDF actions menu.
      document.getElementById("menuView").style.display = "block";
      document
        .getElementById("btnNewTab")
        .addEventListener("click", () => sendAction("newTab"));
      document
        .getElementById("btnDownload")
        .addEventListener("click", () => sendAction("download"));
    } else {
      // Show the "Open PESU" button.
      document.getElementById("loginView").style.display = "block";
      document
        .getElementById("btnOpenPesu")
        .addEventListener("click", () => sendAction("openLogin"));
    }
  });
});

// Sends a message to the background script to perform an action.
function sendAction(action) {
  chrome.runtime.sendMessage({ action: action }, () => {
    window.close();
  });
}
