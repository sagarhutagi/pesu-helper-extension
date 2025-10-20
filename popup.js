document.addEventListener("DOMContentLoaded", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const currentTab = tabs[0];
    if (
      currentTab &&
      currentTab.url &&
      currentTab.url.includes("pesuacademy.com")
    ) {
      document.getElementById("menuView").style.display = "block";
      document
        .getElementById("btnNewTab")
        .addEventListener("click", () => sendAction("newTab"));
      document
        .getElementById("btnDownload")
        .addEventListener("click", () => sendAction("download"));
      document.getElementById("dashboardLink").addEventListener("click", () => {
        chrome.tabs.create({ url: "dashboard.html" });
      });
    } else {
      document.getElementById("loginView").style.display = "block";
      document
        .getElementById("btnOpenPesu")
        .addEventListener("click", () => sendAction("openLogin"));
    }
  });
});

function sendAction(action) {
  chrome.runtime.sendMessage({ action: action }, () => {
    window.close();
  });
}
