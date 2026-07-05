const proxies = [
  "https://invidious.jing.rocks",
  "https://invidious.nerdvpn.de",
  "https://inv.tux.pizza",
  "https://invidious.lunar.icu",
  "https://invidious.projectsegfau.lt",
  "https://invidious.slipfox.xyz",
  "https://invidious.privacyredirect.com",
  "https://invidious.weblibre.org",
  "https://invidious.esmailelbob.xyz",
  "https://vid.puffyan.us",
  "https://invidious.snopyta.org",
  "https://yewtu.be",
  "https://invidious.kavin.rocks",
  "https://cors-anywhere.herokuapp.com"
];

async function testProxies() {
  for (const proxy of proxies) {
    try {
      console.log(`Testing ${proxy}...`);
      const res = await fetch(`${proxy}/api/v1/search?q=test`, { signal: AbortSignal.timeout(5000) });
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
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
