import React, { useState, useEffect, useMemo } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, Tooltip, Dot } from 'recharts';
import { DayEntry, MoonPhase } from '../types';
import { TAROT_DECK, getTodayStr } from '../constants';
import { GeminiService } from '../services/geminiService';
import { Sparkles, Quote, Loader2, Activity, Feather, X, Calendar, Zap } from 'lucide-react';

interface Props {
  data: DayEntry[];
}

// Stats Modal Interface
interface StatDetail {
    type: 'streak' | 'depth';
    value: number;
    label: string;
    subLabel: string;
    icon: React.ElementType;
    color: string;
    message: string;
    analysis: string;
}

const TrendView: React.FC<Props> = ({ data }) => {
  const [insight, setInsight] = useState<string>('');
  const [loadingInsight, setLoadingInsight] = useState(false);
  const [activeStat, setActiveStat] = useState<StatDetail | null>(null);
  
  // Sort data by date
  const sortedData = useMemo(() => {
      return [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [data]);

  // Extract Keywords for the month
  const topKeywords = useMemo(() => {
      const allKeywords = sortedData.flatMap(d => {
          if (!d.todayAwareness?.cardId) return [];
          const card = TAROT_DECK.find(c => c.id === d.todayAwareness!.cardId);
          return card ? card.keywords : [];
      });

      const counts: Record<string, number> = {};
      allKeywords.forEach(k => counts[k] = (counts[k] || 0) + 1);
      
      return Object.entries(counts)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 3)
          .map(([k]) => k);
  }, [sortedData]);

  // --- STATS CALCULATIONS ---
  
  // 1. Total Days (Streak)
  // For this mock/demo, we assume total entries = streak. 
  // In a real app, we would calculate consecutive dates.
  const totalDays = data.length;

  // 2. Cumulative Awareness Depth (Total User Char Count)
  const totalUserChars = useMemo(() => {
      return data.reduce((acc, entry) => {
          const history = entry.todayAwareness?.chatHistory || [];
          // Only count characters from the user
          const dayChars = history
              .filter(msg => msg.role === 'user')
              .reduce((sum, msg) => sum + msg.text.length, 0);
          return acc + dayChars;
      }, 0);
  }, [data]);

  // Generate Insight on Mount
  useEffect(() => {
      const fetchInsight = async () => {
          if (topKeywords.length > 0) {
              setLoadingInsight(true);
              const result = await GeminiService.generateMonthlyInsight(topKeywords);
              setInsight(result);
              setLoadingInsight(false);
          } else {
              setInsight("本月的数据如未写的诗篇，等待你去填充觉察的瞬间。");
          }
      };
      fetchInsight();
  }, [topKeywords]);


  // Prepare chart data - FILTER OUT FUTURE DATES
  const chartData = useMemo(() => {
      const todayStr = getTodayStr();
      return sortedData
        .filter(d => d.date <= todayStr) // Only show data up to today
        .map(d => ({
            date: d.date.split('-').slice(1).join('/'), // MM/DD
            score: d.todayAwareness?.complexityScore || 0,
            title: d.todayAwareness?.selectedTitle || '未记录',
            moonPhase: d.moonPhase
        }));
  }, [sortedData]);

  const CustomDot = (props: any) => {
    const { cx, cy, payload } = props;
    if (!cx || !cy) return null;
    const isBright = payload.moonPhase === MoonPhase.FULL || payload.moonPhase === MoonPhase.WAXING_GIBBOUS || payload.moonPhase === MoonPhase.WANING_GIBBOUS;
    return (
      <g>
        <circle cx={cx} cy={cy} r={8} fill={isBright ? "#818cf8" : "#6366f1"} fillOpacity={0.2} className="animate-pulse" />
        <circle cx={cx} cy={cy} r={3} fill="#fff" stroke="none" />
      </g>
    );
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900/90 border border-indigo-500/30 p-3 rounded-lg shadow-[0_0_15px_rgba(99,102,241,0.3)] backdrop-blur-md text-xs">
          <p className="text-indigo-200 font-bold mb-1">{label}</p>
          <p className="text-white text-sm mb-1">{payload[0].payload.title}</p>
          <div className="flex justify-between items-center text-slate-400 space-x-4">
              <span>灵魂潮汐值: {payload[0].value}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  // --- HANDLERS ---

  const openStatModal = (type: 'streak' | 'depth') => {
      if (type === 'streak') {
          setActiveStat({
              type: 'streak',
              value: totalDays,
              label: '持续觉察天数',
              subLabel: 'CONSECUTIVE DAYS',
              icon: Activity,
              color: 'text-indigo-400',
              message: "时间的河流因你的驻足而闪光。坚持下去，你会看见完整的自己。",
              analysis: `你已经连续 ${totalDays} 天与自我对话。这种持续的能量正在为你构建一个稳定的内核。`
          });
      } else {
          setActiveStat({
              type: 'depth',
              value: totalUserChars,
              label: '累计觉察深度',
              subLabel: 'AWARENESS DEPTH (CHARS)',
              icon: Feather,
              color: 'text-pink-400',
              message: "每一个文字都是灵魂的碎片。你正在拼凑出一个更清晰的宇宙。",
              analysis: `本月你倾诉了 ${totalUserChars} 个字。每一个字都是通往潜意识深处的阶梯。`
          });
      }
  };

  return (
    <div className="h-full overflow-y-auto no-scrollbar pb-24 px-5 pt-8 font-serif relative">
      
      {/* 1. HEADER */}
      <div className="mb-6 flex justify-between items-end">
        <div>
            <h2 className="text-2xl text-white mb-1 tracking-wide">轨迹观察</h2>
            <p className="text-slate-400 text-sm tracking-widest">观测你内心的引力场</p>
        </div>
      </div>

      {/* 2. STATS GRID */}
      <section className="mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
         <div className="grid grid-cols-2 gap-3 w-full">
            <button 
                onClick={() => openStatModal('streak')}
                className="p-4 bg-slate-900/50 rounded-2xl border border-white/5 flex flex-col items-center backdrop-blur-sm hover:bg-slate-800/50 hover:scale-[1.02] transition-all active:scale-95 group"
            >
                <div className="p-2 rounded-full bg-indigo-500/10 mb-2 group-hover:bg-indigo-500/20 transition-colors">
                    <Activity className="text-indigo-400 opacity-80" size={20} />
                </div>
                <span className="text-2xl font-bold text-white font-serif">{totalDays}</span>
                <span className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider group-hover:text-indigo-200 transition-colors">持续觉察 (天)</span>
            </button>
            
            <button 
                onClick={() => openStatModal('depth')}
                className="p-4 bg-slate-900/50 rounded-2xl border border-white/5 flex flex-col items-center backdrop-blur-sm hover:bg-slate-800/50 hover:scale-[1.02] transition-all active:scale-95 group"
            >
                <div className="p-2 rounded-full bg-pink-500/10 mb-2 group-hover:bg-pink-500/20 transition-colors">
                    <Feather className="text-pink-400 opacity-80" size={20} />
                </div>
                <span className="text-2xl font-bold text-white font-serif">{totalUserChars}</span>
                <span className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider group-hover:text-pink-200 transition-colors">累计觉察深度</span>
            </button>
        </div>
      </section>

      {/* 3. CHART SECTION */}
      <section className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
        <div className="flex justify-between items-center mb-3">
            <h3 className="text-indigo-200 text-xs uppercase tracking-[0.2em] flex items-center">
                <Sparkles size={12} className="mr-2 text-indigo-400" />
                灵魂潮汐 · Soul Tides
            </h3>
            <span className="text-[10px] text-slate-600 bg-white/5 px-2 py-0.5 rounded border border-white/5">Complexity Index</span>
        </div>
        
        <div className="h-56 w-full bg-slate-900/50 rounded-2xl border border-white/5 p-4 relative shadow-lg backdrop-blur-sm">
             <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#818cf8" stopOpacity={0.5}/>
                        <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <XAxis dataKey="date" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} tick={{ fill: '#64748b' }} dy={10} />
                    <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1, strokeDasharray: '4 4' }} />
                    <Area type="monotone" dataKey="score" stroke="#818cf8" strokeWidth={2} fillOpacity={1} fill="url(#colorScore)" dot={<CustomDot />} activeDot={{ r: 6, strokeWidth: 0, fill: "#fff" }} animationDuration={1500} />
                </AreaChart>
             </ResponsiveContainer>
        </div>
      </section>

      {/* 4. INSIGHT CARD */}
      <section className="mb-8 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
          <h3 className="text-indigo-200 text-xs uppercase tracking-[0.2em] mb-3">月度回响 · Monthly Echo</h3>
          
          <div className="relative p-1 rounded-2xl bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-slate-800/20">
              <div className="relative bg-slate-900/90 rounded-xl p-5 border border-white/5 backdrop-blur-xl overflow-hidden min-h-[140px] flex flex-col justify-center">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                      <Quote size={60} className="text-white" />
                  </div>
                  <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-indigo-500/20 rounded-full blur-[40px]"></div>

                  <div className="relative z-10">
                      <div className="flex items-center space-x-2 mb-3">
                           {topKeywords.map((k, i) => (
                               <span key={i} className="text-[10px] px-2 py-1 rounded-md bg-indigo-500/20 text-indigo-200 border border-indigo-500/20 tracking-wider">
                                   #{k}
                               </span>
                           ))}
                      </div>

                      {loadingInsight ? (
                          <div className="flex items-center space-x-3 text-slate-500 py-2">
                              <Loader2 size={16} className="animate-spin" />
                              <span className="text-xs tracking-widest">星辰正在编织寄语...</span>
                          </div>
                      ) : (
                          <p className="text-white/90 text-sm leading-6 font-serif italic tracking-wide">
                              "{insight}"
                          </p>
                      )}
                  </div>
                  
                  <div className="absolute bottom-4 right-6">
                      <span className="text-[9px] text-slate-600 tracking-[0.3em] uppercase">AI Oracle</span>
                  </div>
              </div>
          </div>
      </section>

      {/* --- STAT DETAILS MODAL --- */}
      {activeStat && (
          <div className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in duration-300">
              <div className="w-full max-w-sm bg-slate-900 border border-white/10 rounded-3xl p-8 relative overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
                  <button 
                      onClick={() => setActiveStat(null)}
                      className="absolute top-4 right-4 p-2 bg-white/5 rounded-full text-slate-400 hover:text-white transition-colors z-20"
                  >
                      <X size={18} />
                  </button>

                  {/* Dynamic Background */}
                  <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent`}></div>
                  <div className={`absolute -bottom-20 -right-20 w-64 h-64 rounded-full blur-[80px] opacity-20 ${activeStat.type === 'streak' ? 'bg-indigo-500' : 'bg-pink-500'}`}></div>

                  <div className="relative z-10 flex flex-col items-center text-center">
                      <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-6 border border-white/10 ${activeStat.type === 'streak' ? 'bg-indigo-500/10' : 'bg-pink-500/10'}`}>
                          <activeStat.icon size={32} className={activeStat.color} />
                      </div>

                      <h3 className="text-white text-3xl font-serif mb-2">{activeStat.value}</h3>
                      <p className="text-slate-400 text-xs tracking-widest uppercase mb-8">{activeStat.subLabel}</p>

                      <div className="w-full bg-white/5 rounded-xl p-5 border border-white/5 mb-6 text-left relative overflow-hidden">
                          <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500/50"></div>
                          <p className="text-indigo-200 font-serif text-sm leading-relaxed mb-3">
                              "{activeStat.message}"
                          </p>
                          <p className="text-slate-400 text-xs leading-relaxed font-sans">
                              {activeStat.analysis}
                          </p>
                      </div>

                      <button 
                          onClick={() => setActiveStat(null)}
                          className="w-full py-3 bg-white text-slate-900 rounded-full font-bold font-serif tracking-widest hover:scale-105 transition-transform"
                      >
                          保持觉察
                      </button>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};

export default TrendView;