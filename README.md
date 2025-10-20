# PESU PDF Helper

An all-in-one browser extension designed to supercharge the learning experience on the PESU Academy website. This tool transforms from a simple PDF utility into a comprehensive personal study dashboard.

It addresses common workflow frustrations by providing integrated PDF controls, automatic organization, and insightful study habit tracking.

## ✨ Features

- **Integrated PDF Controls:** "Open in New Tab" and "Download" buttons appear directly on the webpage next to the PDF you're viewing, providing instant access without leaving the page.
- **Smart Popup Menu:** The extension icon is context-aware.
  - **On a PESU Academy page**, it provides a one-click link to your personal study dashboard.
  - **On any other website**, it becomes a quick-launch button to open the PESU Academy website.
- **Personal Study Dashboard:** A central hub to visualize and manage your study habits.
  - **Live Time Tracking:** See a live-updating timer of the total time you've spent on the PESU website _today_.
  - **Daily Reset & History:** The timer automatically resets each day, and your previous days' totals are logged in a "Daily History" list.
  - **Recent Topics:** Automatically saves a direct link to the PDF of the last topic you visited for each subject, making it easy to jump back in.
- **Seamless Topic Saving:** When you visit a page with a PDF, the topic is automatically saved to your dashboard, and a sleek, non-intrusive notification appears to confirm it.
- **Intelligent File Naming:** When downloading, PDFs are automatically named after the specific **topic** (e.g., `Basic concepts of ecosystem.pdf`), not the generic subject, keeping your notes perfectly organized.

---

## PESU Helper Screenshot

<img width="303" height="150" alt="Screenshot From 2025-10-19 21-15-52" src="https://github.com/user-attachments/assets/3f34c4b2-bf86-4797-80fd-4d59a925c926" />
<br>
<img width="313" height="183" alt="image" src="https://github.com/user-attachments/assets/b5b9ab2e-7bcc-4201-b7f7-a48ecb9d2094" />

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

---

## 🚀 How to Use

1.  **Accessing PDFs:** Navigate to a course page on PESU Academy and click on a topic link. The green icon buttons for "Open in New Tab" and "Download" will appear in the top-right corner of that PDF's section.
2.  **Accessing the Dashboard:** Left-click the extension's icon in your toolbar while on a PESU Academy page and click the "Dashboard" link.
3.  **Opening PESU Academy:** When on any other website (e.g., Google), left-click the extension icon and click "Open PESU Academy" to be taken directly to the site.

---

## 📂 Project Structure

- `manifest.json`: Defines the extension's permissions, scripts, and core structure.
- `background.js`: The service worker that handles all core logic, including time tracking, topic saving, and message passing.
- `content_script.js` / `content_style.css`: The scripts and styles injected directly onto the PESU Academy page to create the buttons and notifications.
- `dashboard.html` / `dashboard.css` / `dashboard.js`: The files that create the modern, data-driven personal study dashboard.
- `popup.html` / `popup.css` / `popup.js`: The files for the simple, context-aware popup menu.

---

## ⚖️ License

This project is licensed under the MIT License.
