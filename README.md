# PESU PDF Helper

A browser extension designed to enhance the learning experience on the PESU Academy website by providing powerful tools for accessing and organizing course notes.

This extension solves the common frustration of the embedded PDF viewer, giving you full control over your study materials with a clean, modern interface.

## Screenshots
<img width="303" height="150" alt="Screenshot From 2025-10-19 21-15-52" src="https://github.com/user-attachments/assets/3f34c4b2-bf86-4797-80fd-4d59a925c926" />
<br>
<img width="313" height="183" alt="image" src="https://github.com/user-attachments/assets/b5b9ab2e-7bcc-4201-b7f7-a48ecb9d2094" />


## ✨ Features

- **Smart Popup Menu:** The extension's icon is context-aware.
  - **On a PESU Academy page**, it shows actions to open or download the current PDF.
  - **On any other website**, it provides a one-click button to open the PESU Academy website.
- **One-Click PDF Access:** Open course PDFs in a new tab with the full native browser viewer, enabling search, zoom, and print functionality.
- **Intelligent Downloading:** Automatically saves PDF files with the correct **topic name** (e.g., `Process of Computational Problem Solving.pdf`) instead of the generic subject name, keeping your notes perfectly organized.
- **Multiple Ways to Use:** Access features via the intuitive left-click popup menu or a convenient right-click context menu on the page.
- **Customizable Default Action:** Use the Options page to set your preferred action (Open in New Tab or Download) for the right-click menu.
- **Modern & Clean UI:** A simple and beautifully styled interface that feels right at home in your browser.

---

## 🛠️ Installation

Since this extension is not on the Chrome Web Store, you can load it locally in Developer Mode.

1.  **Download the Code:**

    - Clone this repository or download it as a ZIP file and unzip it to a permanent location on your computer.

2.  **Open Your Browser's Extensions Page:**

    - For Chrome, navigate to `chrome://extensions`
    - For Brave, navigate to `brave://extensions`
    - For Microsoft Edge, navigate to `edge://extensions`

3.  **Enable Developer Mode:**

    - Find the "Developer mode" toggle switch, usually in the top-right corner of the page, and turn it on.

4.  **Load the Extension:**

    - Click the **"Load unpacked"** button that appears.
    - In the file selection window, navigate to and select the entire project folder (the one containing the `manifest.json` file).

5.  **Done!**
    - The "PESU PDF Helper" extension icon should now appear in your browser's toolbar. You may need to click the puzzle piece icon to pin it.

---

## 🚀 How to Use

1.  **First-Time Setup (Optional):**

    - Right-click the extension icon and select "Options."
    - Choose your preferred default action for the right-click menu and click "Save."

2.  **On a PESU Academy Page with Notes:**

    - **Left-click** the extension icon to bring up the menu and choose "Open in New Tab" or "Download Directly."
    - Or, **right-click** anywhere on the page and select "Open PDF with Helper" to use your saved default action.

3.  **On Any Other Website:**
    - **Left-click** the extension icon.
    - Click the "Open PESU Academy" button to be taken directly to the website.

---

## 📂 Project Structure

- `manifest.json`: The core file that defines the extension's permissions, scripts, and structure.
- `background.js`: The service worker that handles all the main logic, such as detecting URLs, downloading files, and managing the context menu.
- `popup.html` / `popup.css` / `popup.js`: The files that create the modern, conditional popup menu that appears when you left-click the icon.
- `options.html` / `options.js`: The files for the user settings page.

---

## ⚖️ License

This project currently has no license.
