# PESU PDF Helper

An all-in-one browser extension designed to supercharge the learning experience on the PESU Academy website. This tool transforms from a simple PDF utility into a comprehensive personal study dashboard.

It addresses common workflow frustrations by providing integrated PDF controls, automatic organization, and insightful study habit tracking with a clean, modern interface.

## ✨ Features

- **Integrated PDF Controls:** Icon-only "Open in New Tab" and "Download" buttons appear directly in the top-right corner of the PDF frame when you click to view a topic, providing instant access without leaving the page.
- **Smart Popup Menu (Dark Theme):** The extension's icon is context-aware.
  - **On a PESU Academy page**, it provides a one-click link to your personal study dashboard.
  - **On any other website**, it becomes a quick-launch button to open the PESU Academy website (which will redirect to login if needed).
- **Personal Study Dashboard:** A central hub to visualize and manage your study habits, featuring a modern dark theme and an optimized layout.
  - **Live Time Tracking:** See a live-updating timer showing the total time spent actively viewing course topics or PDFs _today_.
  - **Daily Reset & History:** The timer resets daily, and previous days' totals are logged in a compact "Daily History" list.
  - **Subject Progress Tracker:** Automatically syncs your enrolled subjects from the "My Courses" page. Track your progress across 4 units per subject (Theory, Numericals, Revision 1, Revision 2) using an interactive accordion view.
  - **Exam Filter:** Filter the progress tracker to show only relevant units for ISA 1, ISA 2, or ESA.
  - **Recent Topics:** Automatically saves a direct link to the **PDF** of the last topic you visited for each subject, making it easy to jump back into your study materials.
  - **About Section:** Includes developer info and details about the extension.
- **Seamless Topic Saving:** When you visit a page with a PDF, the topic is automatically saved to your dashboard, and a sleek, non-intrusive notification ("✅ Topic Saved") appears on the page.
- **Intelligent File Naming:** When downloading, PDFs are automatically named after the specific **topic** (e.g., `Basic concepts of ecosystem.pdf`), keeping your notes perfectly organized.

## 🛠️ Installation

As this is a local development extension, you can load it directly into any Chromium-based browser (Chrome, Brave, Edge).

1.  **Download the Code:**

    - Clone this repository or download it as a ZIP file and unzip it to a permanent folder on your computer.

2.  **Open Browser Extensions Page:**

    - Navigate to `chrome://extensions` (for Chrome), `brave://extensions` (for Brave), or `edge://extensions` (for Edge).

3.  **Enable Developer Mode:**

    - Find and enable the "Developer mode" toggle switch, usually located in the top-right corner.

4.  **Load the Extension:**

    - Click the **"Load unpacked"** button.
    - In the file selection window, navigate to and select the entire project folder (the one containing `manifest.json`).

5.  **Ready to Go!**
    - The "PESU PDF Helper" icon will appear in your browser's toolbar. You may need to click the puzzle piece icon to pin it for easy access.

## 🚀 How to Use

1.  **Sync Subjects (First Time & Updates):**

    - Open the PESU Academy **"My Courses"** page in one tab.
    - Open the extension's **Dashboard** (by clicking the extension icon while on a PESU page).
    - On the Dashboard, click the **"Sync Subjects"** button. The progress tracker will populate.

2.  **Accessing PDFs:**

    - Navigate to a course page on PESU Academy and click on a topic link that contains a PDF.
    - The green icon buttons for "Open in New Tab" and "Download" will appear in the top-right corner of that PDF's section.

3.  **Using the Dashboard:**

    - Left-click the extension icon while on any PESU Academy page and click the "Dashboard" link.
    - View your study time, history, recent topics, and update your progress tracker. Use the dropdown to filter units by exam.

4.  **Opening PESU Academy:**
    - When on any other website (e.g., Google), left-click the extension icon and click "Open PESU Academy."

## 📂 Project Structure

- `manifest.json`: Defines the extension's permissions, scripts, and core structure.
- `background.js`: The service worker that handles all core logic (time tracking, topic saving, sync orchestration, message passing, context menu).
- `content_script.js` / `content_style.css`: Scripts and styles injected onto PESU Academy pages to create the in-page buttons and notifications.
- `dashboard.html` / `dashboard.css` / `dashboard.js`: Files for the modern, data-driven personal study dashboard.
- `popup.html` / `popup.css` / `popup.js`: Files for the simple, context-aware popup menu (dark theme).

## ⚖️ License

This project is not under any license.
