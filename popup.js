document.addEventListener("DOMContentLoaded", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const currentTab = tabs[0];
    if (
      currentTab &&
      currentTab.url &&
      currentTab.url.includes("pesuacademy.com")
    ) {
      // Show the simplified menu view
      document.getElementById("menuView").style.display = "block";
      document.getElementById("dashboardLink").addEventListener("click", () => {
        chrome.tabs.create({ url: "dashboard.html" });
      });
    } else {
      // Show the "Open PESU" button
      document.getElementById("loginView").style.display = "block";
      // This listener will now find the button correctly
      document.getElementById("btnOpenPesu").addEventListener("click", () => {
        chrome.runtime.sendMessage({ action: "openLogin" }, () =>
          window.close()
        );
      });
    }
  });
});
