const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const reportDir = path.resolve(__dirname, '..', 'playwright-report');
const shareDir = path.resolve(__dirname, '..', 'shared-report');

if (!fs.existsSync(reportDir)) {
  console.error('No report found. Run tests first: npx playwright test');
  process.exit(1);
}

if (!fs.existsSync(shareDir)) {
  fs.mkdirSync(shareDir, { recursive: true });
}

const now = new Date();
const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
const zipName = `test-report-${timestamp}.zip`;
const zipPath = path.join(shareDir, zipName);

// Remove existing zip if present
if (fs.existsSync(zipPath)) {
  fs.unlinkSync(zipPath);
}

try {
  execSync(
    `powershell -Command "Compress-Archive -Path '${reportDir}\\*' -DestinationPath '${zipPath}'"`,
    { stdio: 'inherit' }
  );
  console.log(`\nReport packaged successfully!`);
  console.log(`Location: shared-report/${zipName}`);
  console.log(`\nHow to share:`);
  console.log(`  1. Send the zip file to your team via email/Teams/Slack`);
  console.log(`  2. Recipients unzip and open index.html in a browser`);
  console.log(`  OR`);
  console.log(`  3. Run: npm run report:serve`);
  console.log(`     Share the Network URL with anyone on the same network`);
} catch (err) {
  console.error('Failed to package report:', err.message);
  process.exit(1);
}
