
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Sparkles, Edit2, Check, X, MapPin, Send, Loader2, ArrowLeft, Star, Telescope, Signal, Zap, AlertCircle } from 'lucide-react';
import { MOON_PHASE_INFO } from '../constants';
import { MoonPhase, DayEntry, UserProfile } from '../types';
import { calculateMoonPhase } from '../utils/uiHelpers';
import RealisticMoon from '../components/RealisticMoon';

interface Props {
    data: DayEntry[];
    userProfile: UserProfile | null;
    onUpdateProfile: (profile: UserProfile) => void;
}

interface StarNote {
    id: string;
    text: string;
    author: string;
    name: string;
    x: number; 
    y: number; 
    size: number;
    delay: number;
    isMe?: boolean;
    likes: number; 
    isLiked: boolean; 
}

const STAR_NAMES = [
    "Sirius Alpha", "Vega", "Altair", "Nova-7", "Lyra", "Orion's Belt", "Echo-X", "Flux", 
    "Aether", "Chronos", "Lumen", "Polaris", "Antares", "Rigel", "Deneb", "Spica", 
    "Atlas", "Electra", "Maia", "Merope", "Kepler-22b", "Proxima", "Solstice", "Equinox",
    "Void Walker", "Nebula Heart", "Silent Dust", "Pale Blue", "Event Horizon", "Starlight"
];

const getRandomName = () => STAR_NAMES[Math.floor(Math.random() * STAR_NAMES.length)];

// Distributed stars across a wider percentage
const MOCK_STARS: StarNote[] = [
    { id: 's1', text: "今天意识到，接受不完美才是最大的完美。", author: "AstralWalker", name: "Sirius Alpha", x: 5, y: 30, size: 24, delay: 0, isMe: false, likes: 34, isLiked: false },
    { id: 's2', text: "月光很美，晚安世界。", author: "Luna", name: "Pale Blue", x: 45, y: 15, size: 16, delay: 1, isMe: false, likes: 12, isLiked: false },
    { id: 's3', text: "放下了执念，心里轻了很多。", author: "Echo_99", name: "Echo-X", x: 25, y: 60, size: 20, delay: 2, isMe: false, likes: 8, isLiked: false },
    { id: 's4', text: "像愚人一样勇敢跳跃吧。", author: "TarotReader", name: "The Fool Star", x: 80, y: 70, size: 28, delay: 0.5, isMe: false, likes: 156, isLiked: true },
    { id: 's5', text: "呼吸，只是呼吸。", author: "Zen", name: "Void Walker", x: 15, y: 50, size: 14, delay: 1.5, isMe: false, likes: 42, isLiked: false },
    { id: 's6', text: "宇宙的引力牵引着我们。", author: "Cosmos", name: "Gravity Well", x: 60, y: 40, size: 22, delay: 1.2, isMe: false, likes: 5, isLiked: false },
    { id: 's7', text: "爱是唯一的答案。", author: "Sophie", name: "Venus", x: 90, y: 25, size: 18, delay: 0.8, isMe: false, likes: 99, isLiked: false },
];

const SoulView: React.FC<Props> = ({ data, userProfile, onUpdateProfile }) => {
  // Use profile from props or fallback to empty default
  const defaultProfile = useMemo(() => userProfile || { birthDate: '2000-01-01', birthTime: '00:00', birthLocation: 'Unknown' }, [userProfile]);

  const [isEditing, setIsEditing] = useState(false);
  
  // Temp Edit States
  const [editDate, setEditDate] = useState(defaultProfile.birthDate);
  const [editTime, setEditTime] = useState(defaultProfile.birthTime);
  const [editLocation, setEditLocation] = useState(defaultProfile.birthLocation);

  // Sync temp state when prop changes (e.g. if loaded late)
  useEffect(() => {
      setEditDate(defaultProfile.birthDate);
      setEditTime(defaultProfile.birthTime);
      setEditLocation(defaultProfile.birthLocation);
  }, [defaultProfile]);

  // Star Sky State
  const [isSkyOpen, setIsSkyOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false); 
  const [isSending, setIsSending] = useState(false); 
  const [myNote, setMyNote] = useState('');
  const [allStars, setAllStars] = useState<StarNote[]>(MOCK_STARS);
  const [focusedStar, setFocusedStar] = useState<StarNote | null>(null);
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // --- DERIVED DATA ---
  
  // 1. Dynamic Natal Info Calculation
  const natalPhase = useMemo(() => {
      const dateParts = defaultProfile.birthDate.split('-').map(Number);
      if (dateParts.length === 3) {
          const date = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
          return calculateMoonPhase(date);
      }
      return MoonPhase.NEW;
  }, [defaultProfile.birthDate]);
  
  const natalInfo = MOON_PHASE_INFO[natalPhase];

  // 2. Dynamic Energy Color based on Latest Entry
  const latestEntry = data[data.length - 1];
  const currentEnergy = latestEntry?.todayAwareness?.energyLevel ?? 50;

  const getMoodColor = (level: number) => {
      if (level >= 80) return { glow: 'bg-amber-500', text: 'text-amber-400', filter: 'hue-rotate(30deg)' }; 
      if (level >= 60) return { glow: 'bg-rose-500', text: 'text-rose-400', filter: 'hue-rotate(0deg) saturate(1.5)' }; 
      if (level >= 40) return { glow: 'bg-indigo-500', text: 'text-indigo-400', filter: 'none' }; 
      if (level >= 20) return { glow: 'bg-cyan-600', text: 'text-cyan-400', filter: 'hue-rotate(180deg)' }; 
      return { glow: 'bg-slate-500', text: 'text-slate-400', filter: 'grayscale(100%)' }; 
  };

  const moodStyle = getMoodColor(currentEnergy);

  // --- HANDLERS ---
  const saveProfile = () => {
      onUpdateProfile({
          birthDate: editDate,
          birthTime: editTime,
          birthLocation: editLocation,
          isSkipped: false // Once edited, it's no longer skipped
      });
      setIsEditing(false);
  };

  const cancelEdit = () => {
      setEditDate(defaultProfile.birthDate);
      setEditTime(defaultProfile.birthTime);
      setEditLocation(defaultProfile.birthLocation);
      setIsEditing(false);
  };

  const openSky = () => {
      setIsSkyOpen(true);
      setIsClosing(false);
      setTimeout(() => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTo({ left: 0, behavior: 'smooth' });
        }
      }, 50);
  };

  const closeSky = () => {
      setIsClosing(true);
      setTimeout(() => {
          setIsSkyOpen(false);
          setIsClosing(false);
      }, 700);
  };

  const handleSendToSky = () => {
      if (!myNote.trim()) return;
      setIsSending(true);
      setTimeout(() => {
          const newStar: StarNote = {
              id: Date.now().toString(),
              text: myNote,
              author: "我",
              name: getRandomName(),
              x: Math.random() * 20 + 5, 
              y: Math.random() * 70 + 15,
              size: Math.random() * 10 + 20, 
              delay: 0,
              isMe: true,
              likes: 0,
              isLiked: false
          };
          setAllStars(prev => [...prev, newStar]);
          setMyNote('');
          setIsSending(false);
          openSky();
      }, 1200);
  };

  const toggleResonance = (starId: string) => {
      setAllStars(prevStars => prevStars.map(star => {
          if (star.id === starId) {
              const isNowLiked = !star.isLiked;
              const newLikes = isNowLiked ? star.likes + 1 : star.likes - 1;
              if (focusedStar && focusedStar.id === starId) {
                  setFocusedStar({ ...star, isLiked: isNowLiked, likes: newLikes });
              }
              return { ...star, isLiked: isNowLiked, likes: newLikes };
          }
          return star;
      }));
  };

  return (
    <div className="h-full flex flex-col items-center justify-start p-5 pt-8 text-center space-y-5 animate-in fade-in duration-700 overflow-y-auto no-scrollbar pb-24">
        
        {/* Natal Moon Visual */}
        <div className="relative w-40 h-40 flex-shrink-0 group">
             <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 blur-[50px] opacity-60 animate-pulse-slow transition-colors duration-1000 ${moodStyle.glow}`}></div>
             <div className="relative w-full h-full flex items-center justify-center animate-float" style={{ filter: moodStyle.filter, transition: 'filter 1s ease' }}>
                <RealisticMoon phase={natalPhase} size={140} />
             </div>
        </div>

        <div className="w-full">
            <h2 className="text-xl font-serif text-white mb-1">本命月相</h2>
            <p className={`text-lg font-medium tracking-wide transition-colors duration-700 ${moodStyle.text}`}>
                {defaultProfile.isSkipped ? "待校准" : natalInfo.cnName}
            </p>
            
            {/* Editable Profile Section */}
            <div className="mt-4 flex flex-col items-center justify-center">
                {isEditing ? (
                    <div className="bg-slate-900/80 border border-indigo-500/50 rounded-xl p-4 w-full max-w-xs space-y-3 animate-in zoom-in-95 shadow-xl">
                        <div className="flex flex-col space-y-1 text-left">
                            <label className="text-[10px] text-slate-400 uppercase tracking-widest">Date</label>
                            <input 
                                type="date" 
                                value={editDate} 
                                onChange={(e) => setEditDate(e.target.value)}
                                className="bg-white/5 border border-white/10 rounded px-2 py-1 text-sm text-white outline-none focus:border-indigo-500"
                            />
                        </div>
                        <div className="flex space-x-3">
                            <div className="flex flex-col space-y-1 text-left flex-1">
                                <label className="text-[10px] text-slate-400 uppercase tracking-widest">Time</label>
                                <input 
                                    type="time" 
                                    value={editTime} 
                                    onChange={(e) => setEditTime(e.target.value)}
                                    className="bg-white/5 border border-white/10 rounded px-2 py-1 text-sm text-white outline-none focus:border-indigo-500"
                                />
                            </div>
                            <div className="flex flex-col space-y-1 text-left flex-1">
                                <label className="text-[10px] text-slate-400 uppercase tracking-widest">Location</label>
                                <input 
                                    type="text" 
                                    value={editLocation} 
                                    onChange={(e) => setEditLocation(e.target.value)}
                                    className="bg-white/5 border border-white/10 rounded px-2 py-1 text-sm text-white outline-none focus:border-indigo-500"
                                />
                            </div>
                        </div>
                        <div className="flex space-x-2 pt-2">
                            <button onClick={saveProfile} className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-1.5 rounded text-xs flex items-center justify-center space-x-1 transition-colors">
                                <Check size={12} /> <span>保存</span>
                            </button>
                            <button onClick={cancelEdit} className="flex-1 bg-white/10 hover:bg-white/20 text-slate-300 py-1.5 rounded text-xs flex items-center justify-center space-x-1 transition-colors">
                                <X size={12} /> <span>取消</span>
                            </button>
                        </div>
                    </div>
                ) : (
                    <div 
                        className="group flex flex-col items-center cursor-pointer p-2 rounded-xl hover:bg-white/5 transition-all" 
                        onClick={() => setIsEditing(true)}
                    >
                        {defaultProfile.isSkipped ? (
                             <div className="flex flex-col items-center space-y-1 py-1">
                                <div className="flex items-center space-x-1.5 text-indigo-300 text-sm font-serif tracking-widest animate-pulse">
                                    <AlertCircle size={14} />
                                    <span>点击校准星图</span>
                                </div>
                                <span className="text-[10px] text-slate-500">完善信息以获取准确指引</span>
                             </div>
                        ) : (
                            <>
                                <div className="flex items-center space-x-2 text-slate-300 text-sm font-serif tracking-widest mb-1">
                                    <span>{defaultProfile.birthDate.replace(/-/g, ' . ')}</span>
                                    <span className="w-1 h-1 bg-slate-600 rounded-full"></span>
                                    <span>{defaultProfile.birthTime}</span>
                                </div>
                                <div className="flex items-center text-slate-500 text-xs gap-1.5">
                                    <MapPin size={10} />
                                    <span className="tracking-wide">{defaultProfile.birthLocation}</span>
                                    <Edit2 size={10} className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity text-indigo-400" />
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>

        {/* Natal Energy Description */}
        <div className="w-full bg-white/5 rounded-2xl p-5 border border-white/10 text-left shadow-lg backdrop-blur-sm">
            <h3 className="flex items-center text-indigo-300 text-xs font-bold mb-2 uppercase tracking-wider">
                <Sparkles size={12} className="mr-2" />
                灵魂能量印记
            </h3>
            {defaultProfile.isSkipped ? (
                <p className="text-slate-400 text-sm leading-relaxed mb-3 font-serif italic text-center py-4">
                    "星空正在等待你的坐标。"
                    <br/><span className="text-xs opacity-60">请设置诞生信息以解锁灵魂印记</span>
                </p>
            ) : (
                <>
                    <p className="text-slate-300 text-sm leading-relaxed mb-3 font-serif">
                        作为诞生于{natalInfo.cnName}的人，你拥有{natalInfo.blessing}
                    </p>
                    <p className="text-slate-400 text-xs leading-relaxed italic border-l-2 border-indigo-500/30 pl-3">
                        你的灵魂倾向于内省与智慧的沉淀。在人生的周期中，你擅长收尾与清理，拥有将过往经验转化为精神财富的天赋。
                    </p>
                </>
            )}
            <div className="mt-3 pt-3 border-t border-white/5">
                <p className="text-[10px] text-slate-500 flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${moodStyle.glow}`}></span>
                    当前能量色调：基于你今日的表达呈现
                </p>
            </div>
        </div>

        {/* STAR SKY INPUT SECTION */}
        <div className="w-full animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
          <div className="flex justify-between items-center mb-3">
             <h3 className="text-indigo-200 text-xs uppercase tracking-[0.2em]">星空随笔 · Galaxy Note</h3>
             <button onClick={openSky} className="text-xs text-indigo-300 hover:text-white transition-colors flex items-center gap-1">
                 进入星空 <ArrowLeft className="rotate-180" size={10} />
             </button>
          </div>
          <div className="bg-slate-900/50 rounded-2xl p-4 border border-white/5 backdrop-blur-sm">
              <textarea 
                  value={myNote}
                  onChange={(e) => setMyNote(e.target.value)}
                  placeholder="写下你此刻的感悟，将它发射到宇宙星空..."
                  className="w-full bg-transparent text-sm text-white placeholder:text-slate-600 font-serif resize-none outline-none min-h-[80px]"
              />
              <div className="flex justify-between items-center mt-2 border-t border-white/5 pt-2">
                  <span className="text-[10px] text-slate-500">{myNote.length}/100</span>
                  <button 
                    onClick={handleSendToSky}
                    disabled={!myNote.trim() || isSending}
                    className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 text-white text-xs px-4 py-2 rounded-full transition-colors"
                  >
                      {isSending ? (
                          <><span>发射中...</span><Loader2 size={12} className="animate-spin" /></>
                      ) : (
                          <><span>发射</span><Send size={12} /></>
                      )}
                  </button>
              </div>
          </div>
        </div>

      {/* --- SKY OVERLAY --- */}
      {isSkyOpen && (
          <div 
            className={`fixed top-0 bottom-0 left-0 right-0 mx-auto w-full max-w-md z-[100] bg-slate-950 flex flex-col overflow-hidden shadow-2xl transition-all duration-700 ease-in-out
                ${isClosing ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}
                animate-in fade-in zoom-in-95
            `}
          >
              {/* HEADER */}
              <div className="absolute top-0 left-0 right-0 p-6 z-20 flex justify-between items-center bg-gradient-to-b from-slate-950 via-slate-950/80 to-transparent h-28 pointer-events-none">
                  <button 
                    onClick={closeSky}
                    className="pointer-events-auto flex items-center space-x-2 text-slate-300 hover:text-white transition-colors bg-white/5 px-4 py-2 rounded-full backdrop-blur-md border border-white/5 shadow-lg"
                  >
                      <ArrowLeft size={16} />
                      <span className="text-xs font-serif tracking-widest">返回</span>
                  </button>
                  
                  <div className="text-right pointer-events-auto">
                    <h2 className="text-lg font-serif text-white tracking-[0.2em] text-shadow">众星回响</h2>
                    <p className="text-[10px] text-indigo-300 tracking-widest uppercase">Galaxy</p>
                  </div>
              </div>

              {/* SCROLLABLE STAR FIELD */}
              <div 
                ref={scrollContainerRef}
                className="absolute inset-0 overflow-x-auto overflow-y-hidden no-scrollbar z-0"
              >
                  <div className="relative h-full w-[300%] bg-slate-950">
                      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30 pointer-events-none bg-repeat-x"></div>
                      <div className="absolute inset-0 bg-gradient-to-b from-indigo-950/20 via-slate-950 to-slate-950 pointer-events-none"></div>

                      <div className="absolute top-28 bottom-24 left-0 right-0">
                          {allStars.map((star) => (
                              <button
                                  key={star.id}
                                  onClick={() => setFocusedStar(star)}
                                  className="absolute group focus:outline-none p-4 -ml-4 -mt-4 transition-transform active:scale-90"
                                  style={{
                                      left: `${star.x}%`,
                                      top: `${star.y}%`, 
                                      animation: `pulse ${2 + Math.random() * 2}s infinite ease-in-out ${star.delay}s`
                                  }}
                              >
                                  {star.isMe && (
                                      <>
                                        <div className="absolute inset-0 bg-amber-500/30 blur-xl rounded-full animate-pulse-slow"></div>
                                        <div className="absolute inset-0 bg-amber-200/10 blur-md rounded-full"></div>
                                      </>
                                  )}
                                  
                                  <Star 
                                      fill="currentColor" 
                                      className={`transition-all duration-700 
                                        ${star.isLiked
                                            ? 'text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.9)] scale-125' 
                                            : star.isMe 
                                                ? 'text-amber-300 drop-shadow-[0_0_15px_rgba(252,211,77,0.9)] scale-150 hover:scale-150' 
                                                : 'text-white opacity-60 hover:opacity-100 hover:scale-125 hover:text-indigo-200'
                                        } 
                                        ${focusedStar?.id === star.id ? 'scale-150 text-indigo-100' : ''}
                                      `}
                                      size={star.size}
                                      strokeWidth={0}
                                  />
                              </button>
                          ))}
                           <div className="absolute left-[30%] top-1/2 -translate-y-1/2 text-white/10 text-4xl animate-pulse select-none pointer-events-none">
                              ›
                          </div>
                      </div>
                  </div>
              </div>

              {/* Pop-up for Selected Star */}
              {focusedStar && (
                  <div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setFocusedStar(null)}>
                      <div 
                        className={`bg-slate-900 border p-8 rounded-2xl shadow-2xl max-w-xs w-full text-center relative animate-in zoom-in-95 duration-300 ${focusedStar.isMe ? 'border-amber-500/30 shadow-[0_0_30px_rgba(245,158,11,0.1)]' : focusedStar.isLiked ? 'border-white/30 shadow-[0_0_30px_rgba(255,255,255,0.1)]' : 'border-indigo-500/30'}`}
                        onClick={(e) => e.stopPropagation()}
                      >
                          <button 
                            onClick={() => setFocusedStar(null)}
                            className="absolute top-4 right-4 text-slate-500 hover:text-white p-2"
                          >
                              <X size={18} />
                          </button>
                          
                          <div className="mb-4">
                              <Sparkles size={24} className={`mx-auto mb-2 animate-pulse ${focusedStar.isMe ? 'text-amber-400' : focusedStar.isLiked ? 'text-white' : 'text-indigo-400'}`} />
                              <div className="flex items-center justify-center space-x-1 text-xs text-slate-400 uppercase tracking-widest font-sans opacity-60">
                                  <Telescope size={10} />
                                  <span>Signal Detected</span>
                              </div>
                          </div>

                          <div className="mb-6">
                             <h3 className={`text-xl font-serif tracking-[0.1em] ${focusedStar.isMe ? 'text-amber-200' : 'text-indigo-100'}`}>
                                 {focusedStar.name}
                             </h3>
                             <div className={`h-px w-8 mx-auto mt-2 ${focusedStar.isMe ? 'bg-amber-500/50' : 'bg-indigo-500/50'}`}></div>
                          </div>
                          
                          <p className="text-white font-serif text-lg leading-relaxed mb-8">
                              "{focusedStar.text}"
                          </p>
                          
                          <div className="mb-6 flex justify-center w-full">
                              {focusedStar.isMe ? (
                                  <div className="bg-amber-900/20 border border-amber-500/30 rounded-full px-5 py-2 flex items-center space-x-3 text-amber-200">
                                      <div className="relative">
                                          <Signal size={16} className="animate-pulse" />
                                          <div className="absolute inset-0 bg-amber-400 rounded-full blur-md opacity-20 animate-ping"></div>
                                      </div>
                                      <span className="text-xs font-serif tracking-widest">能量共振指数: <span className="text-lg font-bold ml-1">{focusedStar.likes}</span></span>
                                  </div>
                              ) : (
                                  <button 
                                    onClick={() => toggleResonance(focusedStar.id)}
                                    className={`group relative px-6 py-3 rounded-full flex items-center space-x-2 transition-all duration-500 overflow-hidden ${
                                        focusedStar.isLiked 
                                        ? 'bg-white text-slate-900 shadow-[0_0_20px_rgba(255,255,255,0.4)] scale-105' 
                                        : 'bg-indigo-600/20 hover:bg-indigo-500/40 text-indigo-100 border border-indigo-500/40'
                                    }`}
                                  >
                                      {focusedStar.isLiked && <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent translate-x-[-100%] animate-[shimmer_1s_infinite]"></div>}
                                      
                                      <Zap size={16} className={focusedStar.isLiked ? 'fill-slate-900' : 'fill-none'} />
                                      <span className="text-xs font-serif tracking-widest font-bold">
                                          {focusedStar.isLiked ? "已建立感应" : "感应能量"}
                                      </span>
                                  </button>
                              )}
                          </div>

                          <div className="flex items-center justify-center space-x-2 text-xs text-slate-400 tracking-widest uppercase border-t border-white/5 pt-4">
                              <span>来自</span>
                              <span className={`${focusedStar.isMe ? 'text-amber-300' : 'text-indigo-300'} font-bold`}>{focusedStar.author}</span>
                          </div>
                      </div>
                  </div>
              )}
          </div>
      )}
    </div>
  );
};

export default SoulView;
