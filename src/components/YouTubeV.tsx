import { useState, useEffect } from "react";
import { Search, Menu, Mic, Bell, Video, CircleUser, Play, Home, Compass, PlaySquare, Clock, ThumbsUp, History, Loader2, ArrowLeft } from "lucide-react";

type VideoData = {
  id: string;
  title: string;
  channel: string;
  views: string | number;
  time: string;
  duration: string;
  thumbnail: string;
};

// Default fallback data for initial load
const MOCK_VIDEOS = [
  { id: "dQw4w9WgXcQ", title: "Rick Astley - Never Gonna Give You Up (Official Music Video)", channel: "Rick Astley", views: "1.4B", time: "14 years ago", duration: "3:33", thumbnail: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=640&q=80&fit=crop" },
];

export function YouTubeV() {
  const [searchQuery, setSearchQuery] = useState("");
  const [videos, setVideos] = useState<VideoData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);

  const fetchVideos = async (query: string = "trending") => {
    setIsLoading(true);
    setError(null);
    try {
      // Using the server proxy to avoid CORS and try multiple backup instances
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Gagal mengambil data dari server");
      }
      
      const data = await res.json();
      
      if (data.items && data.items.length > 0) {
        const mappedVideos = data.items.map((v: any) => {
          // Extract video ID from URL like "/watch?v=abc123xyz"
          const videoId = v.url.split('v=')[1]?.split('&')[0] || '';
          
          return {
            id: videoId,
            title: v.title,
            channel: v.uploaderName,
            views: v.views,
            time: v.uploadedDate || 'Baru saja',
            duration: typeof v.duration === 'string' ? v.duration : 'Live',
            thumbnail: v.thumbnail,
          };
        }).filter((v: VideoData) => v.id); // Only keep items with a valid ID
        
        setVideos(mappedVideos);
      } else {
        setVideos([]);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Terjadi kesalahan koneksi");
      setVideos(MOCK_VIDEOS); // Fallback to mock if API fails
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
      setActiveVideoId(null); // Reset player to show search results
      fetchVideos(searchQuery);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#0f0f0f] text-white overflow-hidden">
      {/* Top Navigation Bar */}
      <nav className="flex items-center justify-between px-4 h-14 shrink-0 transition-colors bg-[#0f0f0f] border-b border-neutral-800/50">
        <div className="flex items-center gap-2 sm:gap-4">
          <button className="p-2 hover:bg-neutral-800 rounded-full hidden sm:block">
            <Menu className="w-6 h-6" />
          </button>
          <div 
            className="flex items-center gap-1 cursor-pointer" 
            onClick={() => { setActiveVideoId(null); fetchVideos("indonesia trending"); }}
          >
            <div className="bg-red-600 rounded-lg w-8 h-6 flex items-center justify-center">
              <Play className="w-3.5 h-3.5 text-white fill-current" />
            </div>
            <span className="text-xl font-bold tracking-tighter">YouTube V</span>
          </div>
        </div>

        <div className="flex flex-1 max-w-[720px] ml-4 mr-2 sm:mx-10 gap-2 sm:gap-4">
          <form onSubmit={handleSearch} className="flex items-center flex-1">
            <div className="flex items-center w-full bg-[#121212] border border-neutral-700/50 rounded-l-full overflow-hidden focus-within:border-blue-500 sm:ml-8">
              <div className="px-4 hidden sm:block">
                <Search className="w-4 h-4 text-neutral-400" />
              </div>
              <input 
                type="text" 
                placeholder="Telusuri video..." 
                className="w-full bg-transparent px-4 sm:px-2 py-2 sm:py-2 text-sm focus:outline-none placeholder:text-neutral-400"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button 
              type="submit" 
              className="px-4 sm:px-5 py-2 bg-neutral-800/80 border border-l-0 border-neutral-700/50 rounded-r-full hover:bg-neutral-700 transition-colors flex items-center justify-center h-[38px] sm:h-[42px]"
            >
              <Search className="w-4 h-5 sm:w-5 text-neutral-200" />
            </button>
          </form>
          <button className="p-2 sm:p-2.5 bg-neutral-800 hover:bg-neutral-700 rounded-full transition-colors shrink-0 hidden sm:block">
            <Mic className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          <button className="p-2 hover:bg-neutral-800 rounded-full hidden sm:block">
            <Video className="w-5 h-5" />
          </button>
          <button className="p-2 hover:bg-neutral-800 rounded-full hidden sm:block">
            <Bell className="w-5 h-5" />
          </button>
          <button className="p-1 hover:bg-neutral-800 rounded-full">
            <CircleUser className="w-7 h-7 sm:w-8 sm:h-8 text-blue-400" />
          </button>
        </div>
      </nav>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-[72px] sm:w-[200px] md:w-[240px] shrink-0 overflow-y-auto hidden sm:flex flex-col bg-[#0f0f0f] border-r border-neutral-800/30 hover:border-transparent custom-scrollbar">
          <div className="py-3 hidden md:block">
            <SidebarItem icon={<Home className="w-5 h-5" />} label="Beranda" active />
            <SidebarItem icon={<Compass className="w-5 h-5" />} label="Eksplorasi" />
            <SidebarItem icon={<PlaySquare className="w-5 h-5" />} label="Subscription" />
            
            <div className="my-3 border-t border-neutral-800" />
            
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
        <main className="flex-1 overflow-y-auto bg-[#0f0f0f] custom-scrollbar focus:outline-none" tabIndex={0}>
          {activeVideoId ? (
            // Video Player View
            <div className="flex flex-col lg:flex-row w-full max-w-[1600px] mx-auto p-0 sm:p-4 gap-6">
              <div className="flex-1">
                <button 
                  onClick={() => setActiveVideoId(null)}
                  className="flex items-center gap-2 mb-4 text-neutral-400 hover:text-white transition-colors px-4 sm:px-0 mt-4 sm:mt-0"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span className="text-sm font-medium">Kembali ke pencarian</span>
                </button>
                <div className="relative w-full aspect-video bg-black sm:rounded-xl overflow-hidden shadow-xl border border-neutral-800/50">
                  <iframe
                    width="100%"
                    height="100%"
                    src={`https://www.youtube.com/embed/${activeVideoId}?autoplay=1&rel=0`}
                    title="YouTube video player"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    className="absolute top-0 left-0 w-full h-full"
                  ></iframe>
                </div>
                <div className="p-4 sm:p-2 sm:mt-4">
                  <h1 className="text-xl font-bold text-white mb-2">Video Sedang Diputar</h1>
                  <p className="text-neutral-400 text-sm">Jika video tidak dapat diputar, mungkin pembuat video menonaktifkan pemutaran di situs lain.</p>
                </div>
              </div>
              <div className="w-full lg:w-[400px] px-4 sm:px-0">
                <h3 className="font-medium text-lg mb-4 text-white">Video Serupa</h3>
                <div className="flex flex-col gap-3">
                  {videos.slice(0, 8).map(v => (
                    <div 
                      key={v.id} 
                      className="flex gap-2 group cursor-pointer hover:bg-neutral-800/50 p-2 rounded-lg transition-colors"
                      onClick={() => setActiveVideoId(v.id)}
                    >
                      <div className="w-[160px] shrink-0 aspect-video rounded-lg overflow-hidden relative">
                        <img src={v.thumbnail} className="w-full h-full object-cover" />
                        <div className="absolute bottom-1 right-1 bg-black/80 px-1 py-0.5 rounded text-[10px] font-medium text-white">
                          {v.duration}
                        </div>
                      </div>
                      <div className="flex flex-col py-0.5">
                        <span className="text-sm font-medium line-clamp-2 leading-tight group-hover:text-blue-400">
                          {v.title}
                        </span>
                        <span className="text-xs text-neutral-400 mt-1">{v.channel}</span>
                        <span className="text-xs text-neutral-400">{v.views} x ditonton</span>
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
              <div className="sticky top-0 z-10 bg-[#0f0f0f]/95 backdrop-blur-sm border-b border-neutral-800/50 px-4 py-3 pb-4">
                <div className="flex gap-3 overflow-x-auto custom-scrollbar pb-1">
                  {['Semua', 'Musik', 'Live', 'Game', 'Berita', 'Programming', 'Podcast', 'Gadget', 'Komedi', 'Trailer'].map((cat, i) => (
                    <button 
                      key={cat}
                      onClick={() => {
                        setSearchQuery(cat);
                        fetchVideos(cat);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${i === 0 ? 'bg-white text-black' : 'bg-neutral-800 text-neutral-200 hover:bg-neutral-700'}`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Video Grid */}
              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-x-4 gap-y-8">
                {isLoading ? (
                  <div className="col-span-full flex flex-col items-center justify-center p-20 gap-4">
                    <Loader2 className="w-10 h-10 text-red-600 animate-spin" />
                    <p className="text-neutral-400 font-medium">Mencari video...</p>
                  </div>
                ) : error && videos.length === 0 ? (
                  <div className="col-span-full flex flex-col items-center justify-center p-20 gap-2">
                    <div className="text-red-500 mb-2 font-bold text-xl">Oops!</div>
                    <p className="text-neutral-400 text-center">{error}</p>
                    <button 
                      onClick={() => fetchVideos(searchQuery || "indonesia")}
                      className="mt-4 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 rounded-full transition-colors text-sm font-medium"
                    >
                      Coba Lagi
                    </button>
                  </div>
                ) : (
                  videos.map((video) => (
                    <div 
                      key={video.id + Math.random().toString()} 
                      className="flex flex-col gap-3 group cursor-pointer"
                      onClick={() => setActiveVideoId(video.id)}
                    >
                      {/* Thumbnail */}
                      <div className="relative aspect-video rounded-xl overflow-hidden bg-neutral-800 border border-neutral-800/50 relative">
                        {/* Fallback image handler for Piped thumbnails */}
                        <img 
                          src={video.thumbnail.startsWith('/') ? `https://pipedapi.kavin.rocks${video.thumbnail}` : video.thumbnail} 
                          alt={video.title} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                          onError={(e) => {
                            // Fallback to high quality external thumbnail if piped proxy fails
                            (e.target as HTMLImageElement).src = `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`;
                          }}
                        />
                        <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors"></div>
                        <div className="absolute bottom-1 right-1 bg-black/90 backdrop-blur-sm px-1.5 py-0.5 rounded-[4px] text-xs font-semibold tracking-wide shadow-md">
                          {video.duration}
                        </div>
                      </div>

                      {/* Details */}
                      <div className="flex gap-3 pr-2">
                        <div className="shrink-0 mt-0.5">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-neutral-800 to-neutral-700 border border-neutral-700 flex items-center justify-center text-xs font-bold text-neutral-300 shadow-inner">
                            {video.channel.charAt(0).toUpperCase()}
                          </div>
                        </div>
                        <div className="flex flex-col">
                          <h3 className="text-[15px] font-medium line-clamp-2 leading-snug mb-1 group-hover:text-blue-400 transition-colors text-neutral-100">
                            {video.title}
                          </h3>
                          <div className="text-[13px] text-neutral-400 font-medium hover:text-neutral-300 transition-colors">
                            {video.channel}
                          </div>
                          <div className="flex items-center text-[13px] text-neutral-400">
                            {video.views} x ditonton <span className="mx-1 text-[8px] leading-none mb-[2px]">●</span> {video.time}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

function SidebarItem({ icon, label, active = false }: { icon: React.ReactNode, label: string, active?: boolean }) {
  return (
    <button className={`w-[90%] mx-auto flex items-center gap-4 px-3 py-2.5 rounded-xl text-sm transition-colors ${active ? 'bg-neutral-800 font-medium' : 'hover:bg-neutral-800/80 font-normal text-neutral-300'}`}>
      <span className={active ? 'text-white' : 'text-neutral-400'}>{icon}</span>
      <span className="truncate">{label}</span>
    </button>
  );
}

function MiniSidebarItem({ icon, label, active = false }: { icon: React.ReactNode, label: string, active?: boolean }) {
  return (
    <button className={`w-[90%] mx-auto flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl transition-colors hover:bg-neutral-800 ${active ? 'text-white' : 'text-neutral-400'}`}>
      {icon}
      <span className="text-[10px] truncate w-full text-center">{label}</span>
    </button>
  );
}
