export async function onRequestGet(context: any) {
  const url = new URL(context.request.url);
  const q = url.searchParams.get("q");

  if (!q) {
    return new Response(JSON.stringify({ error: "Search query is required." }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  try {
    const response = await fetch(`https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept-Language": "id-ID,id;q=0.9",
      }
    });

    if (!response.ok) {
      return new Response(JSON.stringify({ error: "Failed to fetch from YouTube" }), { status: 502, headers: { "Content-Type": "application/json" } });
    }

    const html = await response.text();
    const match = html.match(/ytInitialData\s*=\s*({.+?});/);
    
    if (!match) {
      return new Response(JSON.stringify({ error: "Failed to parse YouTube data" }), { status: 500, headers: { "Content-Type": "application/json" } });
    }

    const ytData = JSON.parse(match[1]);
    const items = ytData.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents?.[0]?.itemSectionRenderer?.contents || [];

    let mappedVideos: any[] = [];
    
    items.forEach((item: any) => {
      if (item.videoRenderer) {
        const v = item.videoRenderer;
        mappedVideos.push({
          id: v.videoId,
          duration: v.lengthText?.simpleText || "0:00",
          views: v.viewCountText?.simpleText || "0 views",
          title: v.title?.runs?.[0]?.text || "",
          channel: v.ownerText?.runs?.[0]?.text || "",
          time: v.publishedTimeText?.simpleText || "",
          thumbnail: v.thumbnail?.thumbnails?.[v.thumbnail?.thumbnails?.length - 1]?.url || v.thumbnail?.thumbnails?.[0]?.url || "",
        });
      } else if (item.reelShelfRenderer) {
        item.reelShelfRenderer.items?.forEach((reelItem: any) => {
          if (reelItem.reelItemRenderer) {
            const r = reelItem.reelItemRenderer;
            mappedVideos.push({
              id: r.videoId,
              duration: "Shorts",
              views: r.viewCountText?.simpleText || "0 views",
              title: r.headline?.simpleText || "",
              channel: r.channelText?.runs?.[0]?.text || "Shorts",
              time: "",
              thumbnail: r.thumbnail?.thumbnails?.[r.thumbnail?.thumbnails?.length - 1]?.url || r.thumbnail?.thumbnails?.[0]?.url || "",
            });
          }
        });
      } else if (item.gridShelfViewModel) {
        item.gridShelfViewModel.contents?.forEach((cItem: any) => {
          const s = cItem.shortsLockupViewModel;
          if (s) {
            const videoId = s.onTap?.innertubeCommand?.reelWatchEndpoint?.videoId;
            const title = s.overlayMetadata?.primaryText?.content || s.accessibilityText;
            const viewsMatch = s.accessibilityText?.match(/,\s*(.+?)\s*-\s*putar/);
            const views = viewsMatch ? viewsMatch[1] : "0 ditonton";
            mappedVideos.push({
              id: videoId,
              duration: "Shorts",
              views: views,
              title: title,
              channel: "Shorts",
              time: "",
              thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
            });
          }
        });
      }
    });

    return new Response(JSON.stringify({ items: mappedVideos }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}
