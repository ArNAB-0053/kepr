# Kepr

> Keep every solution.

Kepr is a lightweight, modern browser extension that automatically saves your accepted coding solutions, submission metadata, revision notes, and progress directly to a GitHub repository of your choice.

---

## Features

- **Automatic Solution Syncing**: Instantly pushes accepted code submissions to your GitHub repository without interrupting your solving workflow.
- **GitHub Integration**: Direct communication with the GitHub API using personal access tokens (PAT) for custom repository sync paths.
- **Problem Notes**: Keep track of key findings, edge cases, and learnings by appending revision notes to each problem path.
- **Submission Metadata Tracking**: Captures and saves detailed runtime metrics, difficulty, memory, language, runtime, and update timestamps inside a structured `metadata.json` file.
- **Session Tracking**: Integrates an active tracker measuring actual focus and time spent solving the problem.
- **Local Storage Fallback**: Gracefully caches configurations and session data in Chrome storage to prevent loss of information when offline or during context invalidation.
- **Multi-Platform Vision**: Designed with a decoupled architecture to expand beyond LeetCode to other major competitive programming and interview prep platforms in the future.

---

## Why Kepr?

When practicing coding problems on platforms like LeetCode, it is incredibly easy to lose track of past solutions, custom revision notes, and focus timings. Standard platforms lack automated version control or centralized hosting for personal solutions.

Kepr solves this by acting as a background sync agent. It detects when a submission has been accepted, captures your Monaco editor text, compiles structural metadata, joins any custom revision notes you have written, and commits them all to your personal GitHub repository automatically. This builds an elegant, search-friendly directory of your coding progress.

---

## Installation

1. **Download the Extension**:
   - Navigate to the [GitHub Releases](https://github.com/your-username/kepr/releases) page.
   - Download the latest `kepr-<version>.zip` build.
   - Extract the zip archive locally on your computer.

2. **Load Unpacked Extension**:
   - Open Google Chrome (or any Chromium-based browser) and navigate to `chrome://extensions/`.
   - Toggle **Developer Mode** on (usually located in the top-right corner).
   - Click the **Load unpacked** button in the top-left corner.
   - Select the extracted folder containing the extension build (e.g., `chrome-mv3-prod` or `chrome-mv3-dev`).

3. **Open Settings**:
   - Click the Kepr extension icon in your toolbar to open the settings panel.

---

## Configuration

To sync solutions to your repository, Kepr requires a brief configuration:

1. **Generate GitHub PAT (Personal Access Token)**:
   - Go to your GitHub account settings: **Settings > Developer Settings > Personal Access Tokens > Fine-grained tokens** (or classic tokens).
   - Generate a new token with repository access scopes enabled: write permissions for **Contents**.
   
2. **Configure Repository**:
   - Enter your token and repository string in the format: `owner/repository-name` (e.g. `octocat/my-solutions`).
   - Click **Test Connection** to verify permissions and API access.

3. **Configure Root Path**:
   - Specify a directory inside your repository (e.g. `DSA/LeetCode` or `Solutions`). If left empty, Kepr will sync folders straight to the root of your repository.
   - Click **Save Settings** to persist the configuration.

![Kepr Settings UI](assets/screenshots/settings.png)

---

## Development

Kepr is built using the **Plasmo** framework for robust cross-browser extension development, combined with **React** and **TypeScript**.

### Prerequisite

Ensure you have [Node.js v22+](https://nodejs.org) and [pnpm](https://pnpm.io) installed.

### Setup & Dev Server

1. Clone this repository:
   ```bash
   git clone https://github.com/your-username/kepr.git
   cd kepr
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Run the development server:
   ```bash
   pnpm dev
   ```

4. Load the development build in Chrome:
   - Navigate to `chrome://extensions/`.
   - Click **Load unpacked** and select the `./build/chrome-mv3-dev` directory.

### Production Build

Create a production-ready package:
```bash
pnpm build
```
This compiles the code and outputs a production folder structure in `./build/chrome-mv3-prod`, ready for compression and hosting.

---

## Project Structure

```text
├── assets/                  # Design assets, logos, and extension icons
├── build/                   # Compiled outputs (ignored in git)
├── src/
│   ├── background/          # Background worker coordinating GitHub operations
│   ├── contents/            # Content scripts observing DOM updates & editor states
│   ├── lib/
│   │   ├── constants/       # Global constants (e.g. default settings)
│   │   ├── github/          # GitHub Rest API services
│   │   ├── leetcode/        # Active tracker timers & Next.js GraphQL parsing logic
│   │   ├── storage/         # Local chrome.storage abstraction layer
│   │   └── types/           # Core TypeScript type definitions
│   └── popup/               # Popup page layout and UI forms
├── package.json             # Build dependencies and Plasmo configuration
└── tsconfig.json            # TypeScript settings and alias paths
```

---

## Roadmap

- **Additional Coding Platforms**: Extend support to platforms like HackerRank, Codeforces, and GeeksforGeeks.
- **Better Metadata Tracking**: Sync memory and runtime performance percentiles, constraints, and tags.
- **Repository Templates**: Automatically initialize a clean landing page (`README.md`) inside the GitHub repository summarizing synced progress.
- **Enhanced Analytics**: Add visual charts of problem difficulties, languages used, and active solving streaks in the extension popup.

---

## Contributing

Contributions are welcome! Please feel free to open issues or submit pull requests to help improve the project.

---

## License

This project is licensed under the [MIT License](LICENSE).
