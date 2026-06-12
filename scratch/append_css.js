const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../app/globals.css');
const cssBlock = `
/* =========================================================
 * CopilotKit Custom Theme Customization (Light/Dark Mode)
 * ========================================================= */
:root {
  --copilot-kit-primary-color: var(--primary);
  --copilot-kit-background-color: var(--card);
  --copilot-kit-text-color: var(--text);
  --copilot-kit-border-color: var(--border);
  --copilot-kit-muted-text-color: var(--text-muted);
  --copilot-kit-secondary-color: var(--surface);
  --copilot-kit-card-background-color: var(--card);
  --copilot-kit-card-border-color: var(--border);
}

[data-theme="dark"] {
  --copilot-kit-primary-color: var(--primary);
  --copilot-kit-background-color: var(--card);
  --copilot-kit-text-color: var(--text);
  --copilot-kit-border-color: var(--border);
  --copilot-kit-muted-text-color: var(--text-muted);
  --copilot-kit-secondary-color: var(--surface);
  --copilot-kit-card-background-color: var(--card);
  --copilot-kit-card-border-color: var(--border);
}

/* Specific component overrides for premium integration */
.copilotKitWindow, .copilotKitPopup {
  background-color: var(--card) !important;
  border: 1px solid var(--border) !important;
  color: var(--text) !important;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15) !important;
}

.copilotKitHeader {
  background-color: var(--surface) !important;
  border-bottom: 1px solid var(--border) !important;
  color: var(--text) !important;
}

.copilotKitButton {
  background-color: var(--primary) !important;
  box-shadow: 0 4px 12px rgba(255, 56, 11, 0.3) !important;
}

.copilotKitMessageUser {
  background-color: var(--primary-soft) !important;
  color: var(--text) !important;
}

.copilotKitMessageAssistant {
  background-color: var(--surface) !important;
  color: var(--text) !important;
  border: 1px solid var(--border) !important;
}
`;

fs.appendFileSync(filePath, cssBlock);
console.log('Successfully appended CopilotKit styling to globals.css');
