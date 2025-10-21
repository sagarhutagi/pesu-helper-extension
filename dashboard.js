let timerInterval;

/**
 * Formats a total number of seconds into a HH:MM:SS string.
 * @param {number} totalSeconds - The total seconds to format.
 * @returns {string} The formatted time string.
 */
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

/**
 * Gets the current date as a 'YYYY-MM-DD' string.
 * @returns {string} The current date string.
 */
function getCurrentDateString() {
  return new Date().toISOString().split("T")[0];
}

/**
 * Starts a live-updating timer on the dashboard for today's study time.
 */
function startLiveTimer() {
  const today = getCurrentDateString();
  chrome.storage.local.get({ timeData: {} }, (data) => {
    let todaySeconds = data.timeData[today] || 0;
    const timeDisplay = document.getElementById("timeDisplay");
    if (timeDisplay) timeDisplay.textContent = formatTime(todaySeconds);
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      todaySeconds++;
      if (timeDisplay) timeDisplay.textContent = formatTime(todaySeconds);
    }, 1000);
  });
}

/**
 * Displays the historical log of daily study times.
 */
function displayDailyHistory() {
  chrome.storage.local.get({ timeData: {} }, (data) => {
    const historyListDiv = document.getElementById("historyList");
    if (!historyListDiv) return;
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

/**
 * Displays the list of recently visited topics that contain a PDF.
 */
function displayLastReadTopics() {
  chrome.storage.local.get({ lastReadTopics: {} }, (data) => {
    const topicListDiv = document.getElementById("topicList");
    if (!topicListDiv) return;
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

/**
 * Filters the visible units in the progress tracker based on the selected exam.
 * @param {string} filterValue - The selected value ('isa1', 'isa2', 'esa').
 */
function filterUnits(filterValue) {
  const allUnits = document.querySelectorAll(".unit-card");
  allUnits.forEach((unit) => {
    const unitNumber = parseInt(unit.dataset.unit, 10);
    let shouldBeVisible = false;

    switch (filterValue) {
      case "isa1":
        if (unitNumber === 1 || unitNumber === 2) shouldBeVisible = true;
        break;
      case "isa2":
        if (unitNumber === 3 || unitNumber === 4) shouldBeVisible = true;
        break;
      case "esa":
      default:
        shouldBeVisible = true;
        break;
    }

    if (shouldBeVisible) {
      unit.classList.remove("hidden");
    } else {
      unit.classList.add("hidden");
    }
  });
}

/**
 * Displays the subject progress tracker.
 */
function displayProgressTracker() {
  chrome.storage.local.get({ progressData: {} }, (data) => {
    const progressListDiv = document.getElementById("progressList");
    if (!progressListDiv) return;
    const subjects = data.progressData;
    progressListDiv.innerHTML = "";

    if (!subjects || Object.keys(subjects).length === 0) {
      progressListDiv.innerHTML =
        '<p>No subjects synced. Please open your "My Courses" page, then click "Sync Subjects".</p>';
      return;
    }

    const accordionContainer = document.createElement("div");
    accordionContainer.className = "subject-accordion";
    for (const subjectName in subjects) {
      const subjectData = subjects[subjectName];
      const detailsElement = document.createElement("details");
      let unitsGridHTML = '<div class="units-grid">';
      for (let i = 1; i <= 4; i++) {
        const unit = `Unit ${i}`;
        const unitData = subjectData[unit];
        unitsGridHTML += `<div class="unit-card" data-unit="${i}"><h4 class="unit-title">${unit}</h4><div class="task-list">`;
        const tasks = ["theory", "Questions", "revision1", "revision2"];
        const taskLabels = ["Theory", "Questions", "Revision 1", "Revision 2"];
        tasks.forEach((task, index) => {
          const isChecked = unitData[task] ? "checked" : "";
          unitsGridHTML += `<label><input type="checkbox" data-subject="${subjectName}" data-unit="${unit}" data-task="${task}" ${isChecked}> ${taskLabels[index]}</label>`;
        });
        unitsGridHTML += `</div></div>`;
      }
      unitsGridHTML += "</div>";
      detailsElement.innerHTML = `<summary>${subjectName}</summary>${unitsGridHTML}`;
      accordionContainer.appendChild(detailsElement);
    }
    progressListDiv.appendChild(accordionContainer);

    progressListDiv
      .querySelectorAll('input[type="checkbox"]')
      .forEach((checkbox) => {
        checkbox.addEventListener("change", (event) => {
          const { subject, unit, task } = event.target.dataset;
          updateProgress(subject, unit, task, event.target.checked);
        });
      });

    // Apply the initial filter after the tracker is built
    const examFilter = document.getElementById("examFilter");
    if (examFilter) {
      filterUnits(examFilter.value);
    }
  });
}

/**
 * Updates the progress of a specific task in storage.
 * @param {string} subject - The subject name.
 * @param {string} unit - The unit name (e.g., 'Unit 1').
 * @param {string} task - The task name (e.g., 'theory').
 * @param {boolean} isComplete - The new completion status.
 */
function updateProgress(subject, unit, task, isComplete) {
  chrome.storage.local.get({ progressData: {} }, (data) => {
    if (data.progressData[subject] && data.progressData[subject][unit]) {
      data.progressData[subject][unit][task] = isComplete;
      chrome.storage.local.set({ progressData: data.progressData });
    }
  });
}

// --- Main Execution on Dashboard Load ---
document.addEventListener("DOMContentLoaded", () => {
  startLiveTimer();
  displayDailyHistory();
  displayLastReadTopics();
  displayProgressTracker();

  const syncButton = document.getElementById("syncSubjectsBtn");
  if (syncButton) {
    syncButton.addEventListener("click", () => {
      chrome.runtime.sendMessage({ action: "syncSubjectsFromPage" });
      syncButton.textContent = "Syncing...";
      syncButton.disabled = true;
    });
  }

  const examFilter = document.getElementById("examFilter");
  if (examFilter) {
    examFilter.addEventListener("change", (event) => {
      filterUnits(event.target.value);
    });
  }

  chrome.runtime.onMessage.addListener((request) => {
    if (request.action === "syncComplete") {
      displayProgressTracker();
      if (syncButton) {
        syncButton.textContent = "Sync Subjects";
        syncButton.disabled = false;
      }
    }
  });
});
