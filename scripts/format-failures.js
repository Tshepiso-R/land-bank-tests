// Extracts failed tests from the Playwright JSON report into a concise format for AI analysis.
const fs = require('fs');
const path = require('path');

const reportPath = path.join(__dirname, '..', 'playwright-report', 'results.json');

if (!fs.existsSync(reportPath)) {
  console.log(JSON.stringify({ summary: { total: 0, passed: 0, failed: 0, flaky: 0 }, failures: [] }));
  process.exit(0);
}

const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));

const failures = [];
let total = 0, passed = 0, failed = 0, flaky = 0;

function walkSuites(suites) {
  for (const suite of suites) {
    if (suite.suites) walkSuites(suite.suites);
    if (!suite.specs) continue;

    for (const spec of suite.specs) {
      for (const test of spec.tests) {
        total++;
        if (test.status === 'expected') { passed++; continue; }
        if (test.status === 'flaky') { flaky++; continue; }
        if (test.status === 'unexpected' || test.status === 'timedOut') {
          failed++;
          // Get the last (final retry) result for the error
          const lastResult = test.results[test.results.length - 1];
          failures.push({
            title: spec.title,
            file: spec.file,
            line: spec.line,
            project: test.projectName,
            retries: test.results.length - 1,
            error: lastResult?.error?.message?.substring(0, 1500) || 'Unknown error',
            snippet: lastResult?.error?.snippet?.substring(0, 500) || '',
            stack: lastResult?.error?.stack?.substring(0, 800) || '',
          });
        }
      }
    }
  }
}

walkSuites(report.suites || []);

console.log(JSON.stringify({ summary: { total, passed, failed, flaky }, failures }, null, 2));
