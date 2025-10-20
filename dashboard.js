let timerInterval;

function formatTime(totalSeconds) {
  if (isNaN(totalSeconds) || totalSeconds < 0) return "00:00:00";
  const hours = Math.floor(totalSeconds / 3600)
    .toString()
    .padStart(2, "0");
  const minutes = Math.floor((totalSeconds % 3600) / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
}

function getCurrentDateString() {
  return new Date().toISOString().split("T")[0];
}

function startLiveTimer() {
  const today = getCurrentDateString();
  chrome.storage.local.get({ timeData: {} }, (data) => {
    let todaySeconds = data.timeData[today] || 0;
    const timeDisplay = document.getElementById("timeDisplay");
    timeDisplay.textContent = formatTime(todaySeconds);

    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      todaySeconds++;
      timeDisplay.textContent = formatTime(todaySeconds);
    }, 1000);
  });
}

function displayDailyHistory() {
  chrome.storage.local.get({ timeData: {} }, (data) => {
    const historyListDiv = document.getElementById("historyList");
    const history = data.timeData;
    const sortedDates = Object.keys(history).sort().reverse();
    if (sortedDates.length === 0) {
      historyListDiv.innerHTML = "<p>No history yet.</p>";
      return;
    }
    let html = "<ul>";
    sortedDates.forEach((date) => {
      html += `<li><strong>${new Date(
        date
      ).toDateString()}</strong><span>${formatTime(history[date])}</span></li>`;
    });
    html += "</ul>";
    historyListDiv.innerHTML = html;
  });
}

function displayLastReadTopics() {
  chrome.storage.local.get({ lastReadTopics: {} }, (data) => {
    const topicListDiv = document.getElementById("topicList");
    const topics = Object.values(data.lastReadTopics);
    if (topics.length === 0) {
      topicListDiv.innerHTML =
        "<p>No topics with PDFs saved yet. Visit a course page with a PDF to start tracking.</p>";
      return;
    }
    let html = "<ul>";
    topics.forEach((topic) => {
      html += `
                <li>
                    <a href="${topic.pdfUrl}" target="_blank">
                        <div>
                            <span class="topic-title">${topic.topic}</span>
                            <span class="subject-name">${topic.subject}</span>
                        </div>
                        <span>&#8599;</span>
                    </a>
                </li>`;
    });
    html += "</ul>";
    topicListDiv.innerHTML = html;
  });
}

document.addEventListener("DOMContentLoaded", () => {
  startLiveTimer();
  displayDailyHistory();
  displayLastReadTopics();
});
