import { useState, useEffect, useRef } from "react";
import { Search, Menu, Mic, Bell, Video, CircleUser, Play, Home, Compass, PlaySquare, Clock, ThumbsUp, History, Loader2, ArrowLeft, MoreHorizontal, Share2, Download, ThumbsDown, ChevronDown, MessageSquare, Music, Pause, SkipForward, SkipBack } from "lucide-react";
import YouTube, { YouTubeProps, YouTubePlayer } from "react-youtube";

type VideoData = {
  id: string;
  title: string;
  channel: string;
  views: string | number;
  time: string;
  duration: string;
  thumbnail: string;
};

export function YouTubeV() {
  const [videos, setVideos] = useState<VideoData[]>([]);
  const [visibleCount, setVisibleCount] = useState(12);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeVideo, setActiveVideo] = useState<VideoData | null>(null);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [showMusic, setShowMusic] = useState(false);
  const [musicSearchQuery, setMusicSearchQuery] = useState("");
  const [isMusicPlayerOpen, setIsMusicPlayerOpen] = useState(false);
  const [musicList, setMusicList] = useState<VideoData[]>([]);
  const [trendingMusic, setTrendingMusic] = useState<VideoData[]>([]);
  const [viralMusic, setViralMusic] = useState<VideoData[]>([]);
  const [searchMusicResults, setSearchMusicResults] = useState<VideoData[]>([]);
  const [activeMusic, setActiveMusic] = useState<VideoData | null>(null);
  const [isLoadingMusic, setIsLoadingMusic] = useState(false);
  const [isSearchingMusic, setIsSearchingMusic] = useState(false);
  const [isPlayingMusic, setIsPlayingMusic] = useState(false);
  const [musicPlayer, setMusicPlayer] = useState<YouTubePlayer | null>(null);

  const fetchMusicDashboard = async () => {
    setIsLoadingMusic(true);
    try {
      // Fetch concurrent dash data
      const [trendRes, viralRes] = await Promise.all([
        fetch(`/api/search?q=${encodeURIComponent("official music video indonesia terbaru trending")}`),
        fetch(`/api/search?q=${encodeURIComponent("lagu indonesia viral tiktok terpopuler")}`)
      ]);
      
      let trendData = { items: [] };
      let viralData = { items: [] };

      if (trendRes.ok) {
        const data = await trendRes.json();
        trendData.items = (data.items || []).filter((item: VideoData) => item.duration !== "Shorts");
      }
      if (viralRes.ok) {
        const data = await viralRes.json();
        viralData.items = (data.items || []).filter((item: VideoData) => item.duration !== "Shorts");
      }

      setTrendingMusic(trendData.items || []);
      setViralMusic(viralData.items || []);
      
      const combined = [...(trendData.items || []), ...(viralData.items || [])];
      // remove duplicates
      const uniqueIds = new Set();
      const uniqueCombined = combined.filter(m => {
        if (!uniqueIds.has(m.id)) {
          uniqueIds.add(m.id);
          return true;
        }
        return false;
      });

      setMusicList(uniqueCombined);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsLoadingMusic(false);
    }
  };

  const handleMusicSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!musicSearchQuery.trim()) return;
    
    setIsSearchingMusic(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(musicSearchQuery + " official audio")}`);
      if (!res.ok) throw new Error("Gagal mengambil data pencarian musik");
      
      const data = await res.json();
      setSearchMusicResults((data.items || []).filter((item: VideoData) => item.duration !== "Shorts"));
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearchingMusic(false);
    }
  };



  const fetchVideos = async (query: string = "indonesia trending") => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Gagal mengambil data dari server");
      }
      
      const data = await res.json();
      
      if (data.items && data.items.length > 0) {
        setVideos(data.items);
        setVisibleCount(12);
      } else {
        setVideos([]);
        setVisibleCount(12);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Terjadi kesalahan koneksi");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos("indonesia trending");
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setActiveVideo(null); // Reset player to show search results
      fetchVideos(searchQuery);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-blue-50 text-blue-950 overflow-hidden font-sans selection:bg-red-500/30 selection:text-white">
      {/* Top Navigation Bar */}
      <nav className="flex items-center justify-between px-4 h-16 shrink-0 transition-colors bg-blue-100/90 backdrop-blur-xl border-b border-blue-200 z-50 sticky top-0 shadow-sm">
        <div className="flex items-center gap-2 sm:gap-4">
          <button className="p-2 hover:bg-black/5 rounded-full hidden sm:block transition-colors">
            <Menu className="w-5 h-5 text-blue-900" />
          </button>
          <div 
            className="flex items-center gap-1.5 cursor-pointer select-none group" 
            onClick={() => { setActiveVideo(null); fetchVideos("indonesia trending"); }}
          >
            <div className="bg-red-600 rounded-lg w-8 h-6 flex items-center justify-center shadow-[0_0_15px_rgba(220,38,38,0.4)] group-hover:scale-105 transition-transform duration-300">
              <Play className="w-3.5 h-3.5 text-white fill-current translate-x-[1px]" />
            </div>
            <span className="text-xl font-bold tracking-tight font-display text-blue-950">YouTube V</span>
          </div>
        </div>

        <div className="flex flex-1 max-w-[720px] ml-4 mr-2 sm:mx-10 gap-2 sm:gap-4">
          <form onSubmit={handleSearch} className="flex items-center flex-1">
            <div className="flex items-center w-full bg-white border border-blue-200 rounded-l-full overflow-hidden focus-within:border-blue-400 focus-within:bg-white transition-all sm:ml-8 shadow-sm">
              <div className="px-4 hidden sm:block">
                <Search className="w-4 h-4 text-blue-700" />
              </div>
              <input 
                type="text" 
                placeholder="Telusuri video..." 
                className="w-full bg-transparent px-4 sm:px-2 py-2.5 text-sm focus:outline-none placeholder:text-blue-700/60 font-medium text-blue-950"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button 
              type="submit" 
              className="px-4 sm:px-6 py-2.5 bg-blue-100/50 border border-l-0 border-blue-200 rounded-r-full hover:bg-blue-200/50 transition-all flex items-center justify-center h-[42px] sm:h-[42px] group"
            >
              <Search className="w-4 h-5 sm:w-4 text-blue-800 group-hover:text-blue-950 transition-colors" />
            </button>
          </form>
          <button className="p-2 sm:p-2.5 bg-blue-100/40 hover:bg-black/5 rounded-full transition-colors shrink-0 hidden sm:block border border-blue-200 shadow-sm">
            <Mic className="w-5 h-5 text-blue-900" />
          </button>
        </div>

        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          <button className="p-2 hover:bg-black/5 rounded-full hidden sm:block transition-colors">
            <Video className="w-5 h-5 text-blue-900" />
          </button>
          <button className="p-2 hover:bg-black/5 rounded-full hidden sm:block transition-colors">
            <Bell className="w-5 h-5 text-blue-900" />
          </button>
          <button className="p-1 hover:bg-black/5 rounded-full transition-colors ml-2">
            <CircleUser className="w-7 h-7 sm:w-8 sm:h-8 text-blue-900" />
          </button>
        </div>
      </nav>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-[72px] sm:w-[200px] md:w-[240px] shrink-0 overflow-y-auto hidden sm:flex flex-col bg-blue-50 border-r border-blue-200 hover:border-blue-300 custom-scrollbar">
          <div className="py-3 hidden md:block">
            <SidebarItem icon={<Home className="w-5 h-5" />} label="Beranda" active />
            <SidebarItem icon={<Compass className="w-5 h-5" />} label="Eksplorasi" />
            <SidebarItem icon={<PlaySquare className="w-5 h-5" />} label="Subscription" />
            
            <div className="my-3 border-t border-blue-200" />
            
            <SidebarItem icon={<History className="w-5 h-5" />} label="Histori" />
            <SidebarItem icon={<Clock className="w-5 h-5" />} label="Tonton Nanti" />
            <SidebarItem icon={<ThumbsUp className="w-5 h-5" />} label="Video yang disukai" />
          </div>

          <div className="py-2 flex flex-col items-center md:hidden gap-1">
             <MiniSidebarItem icon={<Home className="w-6 h-6" />} label="Beranda" active />
             <MiniSidebarItem icon={<Compass className="w-6 h-6" />} label="Shorts" />
             <MiniSidebarItem icon={<PlaySquare className="w-6 h-6" />} label="Subs" />
             <MiniSidebarItem icon={<History className="w-6 h-6" />} label="Koleksi" />
          </div>
        </aside>

        {/* Main Content Area */}
        <main id="main-scroll-container" className="flex-1 overflow-y-auto bg-blue-50 custom-scrollbar focus:outline-none" tabIndex={0}>
          {activeVideo ? (
            // Video Player View
            <div className="flex flex-col lg:flex-row w-full max-w-[1700px] mx-auto p-0 sm:p-6 lg:p-8 gap-8">
              <div className="flex-1">
                <button 
                  onClick={() => setActiveVideo(null)}
                  className="flex items-center gap-2 mb-6 text-blue-700 hover:text-blue-950 transition-colors px-4 sm:px-0 mt-4 sm:mt-0 group w-max"
                >
                  <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                  <span className="text-sm font-semibold tracking-wide">Kembali ke pencarian</span>
                </button>
                <div className="relative w-full aspect-video bg-black sm:rounded-2xl overflow-hidden shadow-[0_20px_60px_rgb(0,0,0,0.2)] border border-blue-200">
                  <iframe
                    width="100%"
                    height="100%"
                    src={`https://www.youtube.com/embed/${activeVideo.id}?autoplay=1&rel=0`}
                    title="YouTube video player"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    className="absolute top-0 left-0 w-full h-full"
                  ></iframe>
                </div>
                
                {/* Video Info Section */}
                <div className="p-4 sm:p-0 sm:mt-6">
                  <h1 className="text-2xl font-bold font-display text-blue-950 mb-4 leading-snug">{activeVideo.title}</h1>
                  
                  {/* Channel & Actions Row */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-blue-100 to-blue-200 flex items-center justify-center text-xl font-bold shadow-inner border border-blue-300 group-hover:border-blue-400 transition-colors text-blue-950">
                        {(activeVideo.channel || "V").charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-bold text-[17px] text-blue-950 leading-tight">{activeVideo.channel}</h3>
                        <p className="text-[13px] text-blue-700 font-medium">1.2M subscriber</p>
                      </div>
                      <button className="ml-4 px-6 py-2.5 bg-blue-950 text-white font-semibold rounded-full hover:bg-blue-800 transition-colors text-[15px] shadow-[0_0_15px_rgba(23,37,84,0.1)]">
                        Subscribe
                      </button>
                    </div>

                    <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-2 sm:pb-0">
                      <div className="flex items-center bg-white rounded-full border border-blue-200 shadow-sm">
                        <button className="flex items-center gap-2 px-5 py-2.5 hover:bg-blue-50 rounded-l-full transition-colors border-r border-blue-200 text-blue-950">
                          <ThumbsUp className="w-5 h-5" />
                          <span className="text-[15px] font-semibold">42K</span>
                        </button>
                        <button className="px-5 py-2.5 hover:bg-blue-50 rounded-r-full transition-colors text-blue-950">
                          <ThumbsDown className="w-5 h-5" />
                        </button>
                      </div>
                      <button className="flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-blue-50 border border-blue-200 shadow-sm rounded-full transition-colors whitespace-nowrap text-blue-950">
                        <Share2 className="w-5 h-5" />
                        <span className="text-[15px] font-semibold">Share</span>
                      </button>
                      <button className="flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-blue-50 border border-blue-200 shadow-sm rounded-full transition-colors whitespace-nowrap hidden sm:flex text-blue-950">
                        <Download className="w-5 h-5" />
                        <span className="text-[15px] font-semibold">Download</span>
                      </button>
                      <button className="p-3 bg-white hover:bg-blue-50 border border-blue-200 shadow-sm rounded-full transition-colors text-blue-950">
                        <MoreHorizontal className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Description Box */}
                  <div 
                    className={`bg-white/60 rounded-2xl p-4 text-[15px] cursor-pointer hover:bg-white border border-blue-200 shadow-sm transition-all ${showFullDescription ? '' : 'line-clamp-3'}`}
                    onClick={() => setShowFullDescription(!showFullDescription)}
                  >
                    <div className="font-semibold mb-1 flex items-center gap-2 text-blue-950">
                      <span>{activeVideo.views}</span>
                      <span>{activeVideo.time}</span>
                    </div>
                    <p className="text-blue-900 whitespace-pre-wrap">
                      Tonton video {activeVideo.title} dari channel {activeVideo.channel}.
                      Jangan lupa untuk like, comment, share, dan subscribe untuk mendukung channel ini!
                      {'\n\n'}
                      {showFullDescription && (
                        <>
                          Follow Social Media Kami:
                          {'\n'}Instagram: @{activeVideo.channel.replace(/\s+/g, '').toLowerCase()}
                          {'\n'}Twitter: @{activeVideo.channel.replace(/\s+/g, '').toLowerCase()}
                          {'\n\n'}Business Inquiries: contact@{activeVideo.channel.replace(/\s+/g, '').toLowerCase()}.com
                        </>
                      )}
                    </p>
                    {!showFullDescription && (
                      <div className="font-medium mt-1 text-blue-950">Lainnya</div>
                    )}
                  </div>


                </div>
              </div>
              
              {/* Related Videos Column */}
              <div className="w-full lg:w-[400px] px-4 sm:px-0">
                <div className="flex gap-2 overflow-x-auto mb-4 no-scrollbar">
                  {['Semua', 'Dari ini', 'Terkait', 'Terbaru'].map((cat, i) => (
                    <button key={cat} className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors border ${i === 0 ? 'bg-blue-950 text-white border-blue-950' : 'bg-white text-blue-950 hover:bg-blue-100 border-blue-200 shadow-sm'}`}>
                      {cat}
                    </button>
                  ))}
                </div>
                <div className="flex flex-col gap-3">
                  {videos.filter(v => v.id !== activeVideo.id).slice(0, 10).map((v, idx) => (
                    <div 
                      key={`${v.id}-${idx}`} 
                      className="flex gap-2 group cursor-pointer hover:bg-white hover:shadow-sm border border-transparent hover:border-blue-200 p-2 rounded-lg transition-all"
                      onClick={() => {
                        setActiveVideo(v);
                        document.getElementById('main-scroll-container')?.scrollTo({ top: 0, behavior: 'auto' });
                      }}
                    >
                      <div className="w-[160px] shrink-0 aspect-video rounded-lg overflow-hidden relative border border-blue-200 shadow-sm">
                        <img 
                          src={v.thumbnail} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = `https://i.ytimg.com/vi/${v.id.split('v=')[1]?.split('&')[0] || v.id}/hqdefault.jpg`;
                          }}
                        />
                        <div className="absolute inset-0 bg-blue-950/10 group-hover:bg-transparent transition-colors"></div>
                        <div className="absolute bottom-1 right-1 bg-black/70 backdrop-blur-sm px-1 py-0.5 rounded text-[10px] font-medium text-white shadow-md">
                          {v.duration}
                        </div>
                      </div>
                      <div className="flex flex-col py-0.5">
                        <span className="text-sm font-medium line-clamp-2 leading-tight group-hover:text-blue-700 text-blue-950">
                          {v.title}
                        </span>
                        <span className="text-xs text-blue-700 mt-1">{v.channel}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            // Search Results / Home View
            <>
              {/* Category Chips */}
              <div className="sticky top-0 z-10 bg-blue-50/90 backdrop-blur-xl border-b border-blue-200 px-4 py-3 shadow-sm">
                <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
                  {['Semua', 'Musik', 'Live', 'Game', 'Berita', 'Programming', 'Podcast', 'Gadget', 'Komedi', 'Trailer'].map((cat) => {
                    const isActiveCat = searchQuery === cat || (searchQuery === "" && cat === "Semua") || (searchQuery === "indonesia trending" && cat === "Semua") || (searchQuery === "indonesia" && cat === "Semua");
                    return (
                    <button 
                      key={cat}
                      onClick={() => {
                        setSearchQuery(cat === 'Semua' ? '' : cat);
                        fetchVideos(cat === 'Semua' ? 'indonesia trending' : cat);
                      }}
                      className={`px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all duration-300 ${isActiveCat ? 'bg-blue-950 text-white shadow-[0_0_15px_rgba(23,37,84,0.1)]' : 'bg-white text-blue-800 hover:bg-blue-100 hover:text-blue-950 border border-blue-200 shadow-sm'}`}
                    >
                      {cat}
                    </button>
                    );
                  })}
                </div>
              </div>

              {/* Video Grid */}
              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-x-3 gap-y-5">
                {isLoading ? (
                  <div className="col-span-full flex flex-col items-center justify-center p-20 gap-4">
                    <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                    <p className="text-blue-700 font-medium">Mencari video...</p>
                  </div>
                ) : error && videos.length === 0 ? (
                  <div className="col-span-full flex flex-col items-center justify-center p-20 gap-2">
                    <div className="text-red-500 mb-2 font-bold text-xl">Oops!</div>
                    <p className="text-blue-700 text-center">{error}</p>
                    <button 
                      onClick={() => fetchVideos(searchQuery || "indonesia")}
                      className="mt-4 px-4 py-2 bg-blue-950 hover:bg-blue-800 rounded-full transition-colors text-sm font-medium text-white shadow-sm"
                    >
                      Coba Lagi
                    </button>
                  </div>
                ) : (
                  <>
                    {videos.slice(0, visibleCount).map((video, idx) => (
                      <div 
                        key={`${video.id}-${idx}`} 
                        className="flex flex-col gap-2 group cursor-pointer"
                        onClick={() => {
                          setActiveVideo(video);
                          document.getElementById('main-scroll-container')?.scrollTo({ top: 0, behavior: 'auto' });
                        }}
                      >
                        {/* Thumbnail */}
                        <div className="relative aspect-video rounded-2xl overflow-hidden bg-blue-100 border border-blue-200 shadow-sm group-hover:shadow-[0_8px_30px_rgb(59,130,246,0.15)] group-hover:border-blue-300 transition-all duration-300">
                          {/* Fallback image handler for Piped thumbnails */}
                          <img 
                            src={video.thumbnail.startsWith('/') ? `https://pipedapi.kavin.rocks${video.thumbnail}` : video.thumbnail} 
                            alt={video.title} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                            loading="lazy"
                            onError={(e) => {
                              // Fallback to high quality external thumbnail if piped proxy fails
                              (e.target as HTMLImageElement).src = `https://i.ytimg.com/vi/${video.id.split('v=')[1]?.split('&')[0] || video.id}/hqdefault.jpg`;
                            }}
                          />
                          <div className="absolute inset-0 bg-blue-900/10 group-hover:bg-transparent transition-colors"></div>
                          <div className="absolute bottom-2 right-2 bg-black/70 backdrop-blur-md px-2 py-0.5 rounded-md text-[11px] font-bold tracking-wider shadow-lg border border-white/20 text-white">
                            {video.duration}
                          </div>
                        </div>

                        {/* Details */}
                        <div className="flex gap-3 pr-2 mt-1">
                          <div className="shrink-0 mt-0.5">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-100 to-blue-200 border border-blue-300 flex items-center justify-center text-sm font-bold text-blue-950 shadow-inner group-hover:border-blue-400 transition-colors">
                              {(video.channel || "V").charAt(0).toUpperCase()}
                            </div>
                          </div>
                          <div className="flex flex-col">
                            <h3 className="text-[17px] font-semibold tracking-tight font-display line-clamp-2 leading-snug mb-1 group-hover:text-blue-700 transition-all text-blue-950">
                              {video.title}
                            </h3>
                            <div className="text-[14px] text-blue-700 font-medium hover:text-blue-950 transition-colors">
                              {video.channel}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    {visibleCount < videos.length && (
                      <div className="col-span-full flex justify-center mt-6 mb-8">
                        <button 
                          onClick={() => setVisibleCount(prev => prev + 12)}
                          className="flex items-center gap-2 bg-blue-100 hover:bg-blue-200 text-blue-950 px-6 py-2.5 rounded-full transition-colors font-medium border border-blue-200 shadow-sm"
                        >
                          <ChevronDown className="w-5 h-5" />
                          Tampilkan Lebih Banyak
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </>
          )}
        </main>
      </div>

      {/* Music Floating Button */}
      <button
        onClick={() => {
          setShowMusic(true);
          if (trendingMusic.length === 0) fetchMusicDashboard();
        }}
        className="fixed bottom-[104px] right-6 w-14 h-14 bg-emerald-950/90 backdrop-blur-xl rounded-full flex items-center justify-center shadow-[0_8px_30px_rgba(16,185,129,0.4)] border border-emerald-500/20 hover:scale-105 active:scale-95 transition-all z-40 group hover:border-emerald-500/50"
        title="YT Music"
      >
        <Music className="w-5 h-5 text-emerald-400/80 group-hover:text-emerald-400 transition-colors" />
      </button>



      {/* Music Modal */}
      {showMusic && (
        <div className="fixed inset-0 z-50 flex justify-center bg-black/60 backdrop-blur-2xl">
          <div className="w-full max-w-[450px] flex flex-col relative h-full bg-green-50 shadow-[0_0_100px_rgba(0,0,0,0.5)] border-x border-green-200 overflow-hidden">
            {!isMusicPlayerOpen ? (
              // BROWSE VIEW
              <div className="flex flex-col h-full w-full">
                {/* Header & Search */}
                <div className="p-5 pt-8 bg-gradient-to-b from-green-100/90 to-transparent z-10 sticky top-0">
                  <div className="flex items-center gap-4 mb-6">
                    <button 
                      onClick={() => setShowMusic(false)} 
                      className="p-2 hover:bg-black/5 rounded-full transition-colors cursor-pointer"
                    >
                      <ArrowLeft className="w-6 h-6 text-green-950" />
                    </button>
                    <h2 className="text-xl font-bold text-green-950 font-display flex items-center gap-2">
                      <Music className="w-5 h-5 text-green-700" />
                      YT Music
                    </h2>
                  </div>
                  <form onSubmit={handleMusicSearch} className="relative">
                    <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-green-800/70" />
                    <input 
                      type="text" 
                      placeholder="Cari lagu, artis, atau album..." 
                      className="w-full bg-white/60 border border-green-200 rounded-full py-3 pl-12 pr-4 text-green-950 focus:outline-none focus:bg-white focus:border-green-400 transition-all font-medium text-[15px] placeholder:text-green-800/50 shadow-sm"
                      value={musicSearchQuery}
                      onChange={(e) => setMusicSearchQuery(e.target.value)}
                    />
                  </form>
                </div>

                <div className="flex-1 overflow-y-auto no-scrollbar pb-32 px-5">
                  {isSearchingMusic || isLoadingMusic ? (
                    <div className="h-40 flex items-center justify-center">
                      <Loader2 className="w-8 h-8 animate-spin text-green-600" />
                    </div>
                  ) : searchMusicResults.length > 0 ? (
                    <div className="flex flex-col gap-4">
                      <h3 className="font-bold text-green-950 text-lg font-display mb-2">Hasil Pencarian</h3>
                      {searchMusicResults.map((music) => (
                        <div 
                          key={music.id} 
                          className="flex items-center gap-4 cursor-pointer group p-2 hover:bg-green-200/50 rounded-2xl transition-all"
                          onClick={() => {
                            setActiveMusic(music);
                            setMusicList(searchMusicResults);
                            setIsMusicPlayerOpen(true);
                          }}
                        >
                          <div className="w-16 h-16 rounded-xl overflow-hidden shadow-md relative">
                            <img src={music.thumbnail} alt={music.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                            <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <Play className="w-6 h-6 text-white fill-current" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-green-950 font-semibold truncate text-[16px] mb-1 group-hover:text-green-700 transition-colors">{music.title}</p>
                            <p className="text-green-800/70 text-[14px] truncate">{music.channel}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <>
                      {/* Trending Horizontal Cards */}
                      <div className="mb-10">
                        <h3 className="font-bold text-green-950 text-xl font-display mb-4">Sedang Tren</h3>
                        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 -mx-5 px-5 snap-x">
                          {trendingMusic.map((music) => (
                            <div 
                              key={music.id} 
                              className="w-[280px] shrink-0 cursor-pointer group snap-center"
                              onClick={() => {
                                setActiveMusic(music);
                                setMusicList(trendingMusic);
                                setIsMusicPlayerOpen(true);
                              }}
                            >
                              <div className="w-full aspect-[4/3] rounded-3xl overflow-hidden mb-4 relative shadow-lg">
                                <img src={music.thumbnail} alt={music.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                                <div className="absolute bottom-4 left-4 right-4">
                                  <p className="text-white font-bold text-lg leading-snug line-clamp-2 mb-1 group-hover:text-green-300 transition-colors">{music.title}</p>
                                  <p className="text-white/80 text-sm">{music.channel}</p>
                                </div>
                                <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                                  <div className="w-16 h-16 bg-white/30 rounded-full flex items-center justify-center backdrop-blur-md">
                                    <Play className="w-8 h-8 text-white fill-current ml-1" />
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Viral List */}
                      <div className="mb-8">
                        <h3 className="font-bold text-green-950 text-xl font-display mb-4">Lagu Viral & Terpopuler</h3>
                        <div className="flex flex-col gap-2">
                          {viralMusic.map((music, index) => (
                            <div 
                              key={music.id} 
                              className="flex items-center gap-4 cursor-pointer group p-3 hover:bg-green-200/50 rounded-2xl transition-all"
                              onClick={() => {
                                setActiveMusic(music);
                                setMusicList(viralMusic);
                                setIsMusicPlayerOpen(true);
                              }}
                            >
                              <span className="text-green-800 font-bold w-4 text-center group-hover:hidden">{index + 1}</span>
                              <span className="w-4 text-center hidden group-hover:block">
                                <Play className="w-4 h-4 text-green-700 fill-current" />
                              </span>
                              <div className="w-14 h-14 rounded-xl overflow-hidden shadow-sm">
                                <img src={music.thumbnail} alt={music.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-green-950 font-semibold truncate text-[15px] mb-0.5 group-hover:text-green-700 transition-colors">{music.title}</p>
                                <p className="text-green-800/70 text-[13px] truncate">{music.channel}</p>
                              </div>
                              <button className="p-2 text-green-800/50 hover:text-green-700 opacity-0 group-hover:opacity-100 transition-opacity">
                                <MoreHorizontal className="w-5 h-5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Mini Player */}
                {activeMusic && (
                  <div className="absolute bottom-4 left-4 right-4 bg-white/80 backdrop-blur-xl border border-green-200 rounded-2xl p-3 flex items-center gap-4 shadow-[0_10px_40px_rgba(0,0,0,0.1)] cursor-pointer group hover:bg-white transition-colors" onClick={() => setIsMusicPlayerOpen(true)}>
                    <div className="w-12 h-12 rounded-lg overflow-hidden relative">
                      <img src={activeMusic.thumbnail} className="w-full h-full object-cover" />
                      {!isPlayingMusic && (
                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                          <Play className="w-4 h-4 text-white fill-current opacity-90" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-green-950 font-bold text-[14px] truncate">{activeMusic.title}</p>
                      <p className="text-green-800/80 text-[12px] truncate">{activeMusic.channel}</p>
                    </div>
                    <div className="flex items-center gap-2 pr-2" onClick={(e) => e.stopPropagation()}>
                       <button 
                        onClick={() => {
                          if (musicPlayer) {
                            if (isPlayingMusic) musicPlayer.pauseVideo();
                            else musicPlayer.playVideo();
                            setIsPlayingMusic(!isPlayingMusic);
                          }
                        }}
                        className="p-2 hover:bg-green-100 rounded-full text-green-700"
                      >
                        {isPlayingMusic ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current" />}
                      </button>
                    </div>
                     {/* Hidden YouTube Video instance to keep music playing in background */}
                     <div className="hidden">
                        <YouTube 
                          videoId={activeMusic.id} 
                          opts={{ height: '10', width: '10', playerVars: { autoplay: 1, playsinline: 1 } }}
                          onReady={(e) => setMusicPlayer(e.target)}
                          onStateChange={(e) => {
                            if (e.data === 0) {
                              const currentIndex = musicList.findIndex(m => m.id === activeMusic.id);
                              if (currentIndex < musicList.length - 1) setActiveMusic(musicList[currentIndex + 1]);
                            } else if (e.data === 1) setIsPlayingMusic(true);
                            else if (e.data === 2) setIsPlayingMusic(false);
                          }}
                        />
                     </div>
                  </div>
                )}
              </div>
            ) : (
              // PLAYER VIEW
              <>
                {/* Background Blur Image */}
                {activeMusic && (
                  <div className="absolute inset-0 z-0 overflow-hidden opacity-[0.15] pointer-events-none">
                    <img src={activeMusic.thumbnail} className="w-full h-full object-cover blur-[60px] saturate-200" />
                    <div className="absolute inset-0 bg-gradient-to-b from-green-50/60 via-green-100/90 to-green-200"></div>
                  </div>
                )}
                
                {/* Header */}
                <div className="flex items-center justify-between p-4 z-40 bg-transparent gap-4 mt-2">
                  <button 
                    onClick={() => setIsMusicPlayerOpen(false)} 
                    className="p-3 hover:bg-black/5 rounded-full transition-colors cursor-pointer group"
                  >
                    <ChevronDown className="w-6 h-6 text-green-950 group-hover:translate-y-1 transition-transform" />
                  </button>
                  <h2 className="text-xs font-bold tracking-[0.2em] text-green-800 uppercase text-center flex-1 font-display">
                    Sedang Diputar
                  </h2>
                  <div className="w-12"></div> {/* Spacer for alignment */}
                </div>

                <div className="flex flex-col flex-1 overflow-y-auto no-scrollbar px-7 pb-8 pt-4 z-10">
                  {/* Visualizer / Video */}
                  <div className="w-full aspect-square rounded-[32px] overflow-hidden bg-green-200 shadow-[0_30px_60px_rgba(0,0,0,0.2)] mb-10 relative border border-green-300 group">
                    <YouTube 
                      videoId={activeMusic?.id} 
                      opts={{
                        height: '100%',
                        width: '100%',
                        playerVars: {
                          autoplay: 1,
                          controls: 0,
                          modestbranding: 1,
                          playsinline: 1,
                        }
                      }}
                      onReady={(e) => {
                        setMusicPlayer(e.target);
                      }}
                      onStateChange={(e) => {
                        if (e.data === 0) { // ENDED
                          const currentIndex = musicList.findIndex(m => m.id === activeMusic?.id);
                          if (currentIndex < musicList.length - 1) {
                            setActiveMusic(musicList[currentIndex + 1]);
                          }
                        } else if (e.data === 1) { // PLAYING
                          setIsPlayingMusic(true);
                        } else if (e.data === 2) { // PAUSED
                          setIsPlayingMusic(false);
                        }
                      }}
                      className="w-full h-full absolute inset-0 pointer-events-none"
                      iframeClassName="w-full h-full object-cover scale-[1.3]" // Scale to hide borders
                    />
                    {!isPlayingMusic && (
                       <div className="absolute inset-0 bg-white/20 flex items-center justify-center backdrop-blur-sm transition-all pointer-events-none">
                         <Play className="w-16 h-16 text-green-700 fill-current opacity-90 drop-shadow-md" />
                       </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex flex-col mb-10 pointer-events-none text-center">
                    <h3 className="text-[26px] font-bold text-green-950 line-clamp-2 leading-tight mb-3 font-display tracking-tight drop-shadow-sm">{activeMusic?.title}</h3>
                    <p className="text-green-800 text-[17px] font-medium">{activeMusic?.channel}</p>
                  </div>

                  {/* Controls */}
                  <div className="flex items-center justify-center gap-10 mb-12">
                    <button 
                      onClick={() => {
                        const currentIndex = musicList.findIndex(m => m.id === activeMusic?.id);
                        if (currentIndex > 0) {
                          setActiveMusic(musicList[currentIndex - 1]);
                        }
                      }}
                      className="p-3 text-green-800/70 hover:text-green-950 transition-colors disabled:opacity-30 hover:scale-110 active:scale-95"
                      disabled={musicList.findIndex(m => m.id === activeMusic?.id) === 0}
                    >
                      <SkipBack className="w-9 h-9 fill-current" />
                    </button>
                    
                    <button 
                      onClick={() => {
                        if (musicPlayer) {
                          if (isPlayingMusic) {
                            musicPlayer.pauseVideo();
                          } else {
                            musicPlayer.playVideo();
                          }
                          setIsPlayingMusic(!isPlayingMusic);
                        }
                      }}
                      className="w-[84px] h-[84px] bg-green-700 text-white rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-transform shadow-[0_10px_30px_rgba(21,128,61,0.4)]"
                    >
                      {isPlayingMusic ? <Pause className="w-10 h-10 fill-current" /> : <Play className="w-10 h-10 fill-current ml-2" />}
                    </button>

                    <button 
                      onClick={() => {
                        const currentIndex = musicList.findIndex(m => m.id === activeMusic?.id);
                        if (currentIndex < musicList.length - 1) {
                          setActiveMusic(musicList[currentIndex + 1]);
                        }
                      }}
                      className="p-3 text-green-800/70 hover:text-green-950 transition-colors disabled:opacity-30 hover:scale-110 active:scale-95"
                      disabled={musicList.findIndex(m => m.id === activeMusic?.id) === musicList.length - 1}
                    >
                      <SkipForward className="w-9 h-9 fill-current" />
                    </button>
                  </div>

                  {/* Queue / Up Next */}
                  <div className="flex flex-col gap-4 mt-auto bg-green-200/50 p-5 rounded-3xl border border-green-300/50 backdrop-blur-md">
                    <h4 className="font-bold text-green-800 uppercase text-xs tracking-widest mb-1 px-1">Berikutnya</h4>
                    {musicList.slice(musicList.findIndex(m => m.id === activeMusic?.id) + 1, musicList.findIndex(m => m.id === activeMusic?.id) + 6).map((music) => (
                      <div 
                        key={music.id} 
                        className="flex items-center gap-4 cursor-pointer group p-2 hover:bg-white/40 rounded-2xl transition-all"
                        onClick={() => setActiveMusic(music)}
                      >
                        <div className="w-14 h-14 rounded-xl overflow-hidden bg-green-300 shrink-0 shadow-md">
                          <img src={music.thumbnail} alt={music.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        </div>
                        <div className="flex-1 min-w-0 pointer-events-none">
                          <p className="text-green-950 font-semibold truncate text-[15px] mb-0.5">{music.title}</p>
                          <p className="text-green-800/80 text-[13px] truncate">{music.channel}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function SidebarItem({ icon, label, active = false }: { icon: React.ReactNode, label: string, active?: boolean }) {
  return (
    <button className={`w-[90%] mx-auto flex items-center gap-4 px-3 py-3 rounded-xl text-[15px] transition-all duration-300 ${active ? 'bg-blue-100 font-semibold text-blue-950 shadow-sm' : 'hover:bg-blue-100/50 font-medium text-blue-700 hover:text-blue-950'}`}>
      <span className={`${active ? 'text-blue-950' : 'text-blue-700 group-hover:text-blue-950'} transition-colors`}>{icon}</span>
      <span className="truncate tracking-wide">{label}</span>
    </button>
  );
}

function MiniSidebarItem({ icon, label, active = false }: { icon: React.ReactNode, label: string, active?: boolean }) {
  return (
    <button className={`w-[90%] mx-auto flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl transition-all duration-300 hover:bg-blue-100/50 ${active ? 'text-blue-950 bg-blue-100 shadow-sm' : 'text-blue-700 hover:text-blue-950'}`}>
      {icon}
      <span className="text-[10px] truncate w-full text-center tracking-wider">{label}</span>
    </button>
  );
}
