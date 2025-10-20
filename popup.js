document.addEventListener("DOMContentLoaded", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const currentTab = tabs[0];
    if (
      currentTab &&
      currentTab.url &&
      currentTab.url.includes("pesuacademy.com")
    ) {
      document.getElementById("menuView").style.display = "block";
      document.getElementById("dashboardLink").addEventListener("click", () => {
        chrome.tabs.create({ url: "dashboard.html" });
      });
    } else {
      document.getElementById("loginView").style.display = "block";
      document.getElementById("btnOpenPesu").addEventListener("click", () => {
        chrome.runtime.sendMessage({ action: "openLogin" }, () =>
          window.close()
        );
      });
    }
  });
});
