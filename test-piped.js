const proxies = [
  "https://pipedapi.kavin.rocks",
  "https://pipedapi.tokhmi.xyz",
  "https://pipedapi.syncpundit.io",
  "https://pipedapi.smnz.de",
  "https://piped-api.lunar.icu",
  "https://api.piped.projectsegfau.lt"
];

async function testProxies() {
  for (const proxy of proxies) {
    try {
      console.log(`Testing ${proxy}...`);
      const res = await fetch(`${proxy}/search?q=test&filter=all`, { signal: AbortSignal.timeout(5000) });
      if (res.ok) {
        const data = await res.json();
        if (data && data.items && data.items.length > 0) {
          console.log(`✅ SUCCESS: ${proxy}`);
          return;
        }
      } else {
        console.log(`❌ FAILED: ${proxy} (Status: ${res.status})`);
      }
    } catch (e) {
      console.log(`❌ FAILED: ${proxy} (${e.message})`);
    }
  }
}
testProxies();
