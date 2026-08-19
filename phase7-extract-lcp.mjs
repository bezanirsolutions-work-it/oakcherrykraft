import fs from 'fs';

const run1 = JSON.parse(fs.readFileSync('lighthouse-phase6-run1.json', 'utf-8'));

const lcp = run1.audits['largest-contentful-paint'];

console.log('\n=== STEP 2: LCP ELEMENT IDENTIFICATION ===\n');
console.log('LCP Value:', lcp.numericValue.toFixed(0), 'ms');
console.log('LCP Display:', lcp.displayValue);

if (lcp.details) {
  console.log('\nLCP Element Details:');
  console.log(JSON.stringify(lcp.details, null, 2));
}

// Get long tasks
const tbt = run1.audits['long-tasks'];
if (tbt && tbt.details) {
  console.log('\n=== STEP 3: LONG TASKS DATA ===\n');
  console.log('Long Tasks Table:', tbt.details.items?.length || 0, 'items');
  
  tbt.details.items.forEach((task, i) => {
    console.log(`\n${i + 1}. Task`);
    console.log('   Duration:', Math.round(task.duration), 'ms');
    console.log('   Start:', Math.round(task.startTime), 'ms');
    console.log('   URL:', task.url);
  });
  
  if (tbt.details.debugData) {
    console.log('\n--- Debug Data ---');
    console.log('URLs:', tbt.details.debugData.urls);
    console.log('Tasks count:', tbt.details.debugData.tasks?.length);
    
    tbt.details.debugData.tasks?.forEach((t, i) => {
      const urls = tbt.details.debugData.urls;
      console.log(`\nTask ${i+1}:`);
      console.log('  URL: ', urls[t.urlIndex]);
      console.log('  Start:', t.startTime.toFixed(0), 'ms');
      console.log('  Duration:', t.duration, 'ms');
      console.log('  Type: ', Object.keys(t).filter(k => k !== 'urlIndex' && k !== 'startTime' && k !== 'duration').map(k => k + '=' + t[k]).join(', '));
    });
  }
}

console.log('\n=== PERFORMANCE METRICS SUMMARY ===\n');
const metrics = {
  'FCP': run1.audits['first-contentful-paint']?.numericValue,
  'LCP': run1.audits['largest-contentful-paint']?.numericValue,
  'TBT': run1.audits['total-blocking-time']?.numericValue,
  'CLS': run1.audits['cumulative-layout-shift']?.numericValue,
  'SI': run1.audits['speed-index']?.numericValue,
  'TTI': run1.audits['interactive']?.numericValue,
};

Object.entries(metrics).forEach(([name, val]) => {
  if (val !== undefined) {
    console.log(`${name}: ${val.toFixed(0)}ms`);
  }
});
