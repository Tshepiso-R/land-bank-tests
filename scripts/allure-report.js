const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const allureResults = path.resolve(__dirname, '..', 'allure-results');
const allureReport = path.resolve(__dirname, '..', 'allure-report');
const historyDir = path.join(allureReport, 'history');
const resultsHistory = path.join(allureResults, 'history');

// Step 1: Preserve history from previous report into results
if (fs.existsSync(historyDir)) {
  console.log('Preserving history from previous report...');
  if (!fs.existsSync(resultsHistory)) {
    fs.mkdirSync(resultsHistory, { recursive: true });
  }
  const files = fs.readdirSync(historyDir);
  for (const file of files) {
    fs.copyFileSync(path.join(historyDir, file), path.join(resultsHistory, file));
  }
}

// Step 2: Generate the report
console.log('Generating Allure report...');
try {
  execSync('npx allure generate allure-results --clean -o allure-report', {
    cwd: path.resolve(__dirname, '..'),
    stdio: 'inherit',
  });
  console.log('\nAllure report generated at: allure-report/');
} catch (err) {
  console.error('Failed to generate report:', err.message);
  process.exit(1);
}
