import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Search, 
  RefreshCw, 
  Newspaper, 
  BarChart3, 
  PieChart, 
  Activity,
  AlertCircle,
  ChevronRight,
  Plus
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  BarChart, 
  Bar, 
  Cell,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { analyzeSentiment } from './services/geminiService';
import { NewsArticle, SentimentAnalysis, HistoricalData } from './types';
import { cn } from './utils';

// --- Components ---

const Card = ({ children, className, title, icon: Icon }: { children: React.ReactNode, className?: string, title?: string, icon?: any }) => (
  <div className={cn("bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm", className)}>
    {title && (
      <div className="px-6 py-4 border-bottom border-slate-100 flex items-center justify-between bg-slate-50/50">
        <h3 className="font-semibold text-slate-800 flex items-center gap-2">
          {Icon && <Icon size={18} className="text-slate-500" />}
          {title}
        </h3>
      </div>
    )}
    <div className="p-6">
      {children}
    </div>
  </div>
);

const Badge = ({ children, variant = 'neutral' }: { children: React.ReactNode, variant?: 'bullish' | 'bearish' | 'neutral' }) => {
  const variants = {
    bullish: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    bearish: 'bg-rose-100 text-rose-700 border-rose-200',
    neutral: 'bg-slate-100 text-slate-700 border-slate-200',
  };
  return (
    <span className={cn("px-2.5 py-0.5 rounded-full text-xs font-medium border", variants[variant])}>
      {children}
    </span>
  );
};

// --- Main App ---

export default function App() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [batchAnalyzing, setBatchAnalyzing] = useState(false);
  const [batchProgress, setBatchProgress] = useState(0);
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);
  const [analysis, setAnalysis] = useState<SentimentAnalysis | null>(null);
  const [customNews, setCustomNews] = useState('');
  const [history, setHistory] = useState<HistoricalData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [sectorScores, setSectorScores] = useState<Record<string, { total: number, count: number }>>({
    'Technology': { total: 0, count: 0 },
    'Banking': { total: 0, count: 0 },
    'Defense': { total: 0, count: 0 },
    'Energy': { total: 0, count: 0 },
    'Automotive': { total: 0, count: 0 },
    'Pharmaceuticals': { total: 0, count: 0 },
  });
  const [allOpportunities, setAllOpportunities] = useState<any[]>([]);

  const fetchNews = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/news');
      const data = await res.json();
      if (data.articles) {
        setArticles(data.articles);
        return data.articles;
      } else {
        setError("No articles found in RSS feed.");
        return [];
      }
    } catch (err) {
      setError("Failed to fetch news from RSS. Please check your connection.");
      return [];
    } finally {
      setLoading(false);
    }
  };

  const runBatchAnalysis = async (newsArticles: NewsArticle[]) => {
    if (newsArticles.length === 0) return;
    setBatchAnalyzing(true);
    setBatchProgress(0);
    
    const toAnalyze = newsArticles.slice(0, 10);
    const results: SentimentAnalysis[] = [];
    
    for (let i = 0; i < toAnalyze.length; i++) {
      try {
        const result = await analyzeSentiment(toAnalyze[i].title, toAnalyze[i].content || toAnalyze[i].title);
        results.push(result);
        
        // Update history and sectors incrementally
        updateGlobalState(result);
        setBatchProgress(Math.round(((i + 1) / toAnalyze.length) * 100));
      } catch (err) {
        console.error("Batch analysis error for article", i, err);
      }
    }
    
    setBatchAnalyzing(false);
  };

  const updateGlobalState = (result: SentimentAnalysis) => {
    // Update history
    const newHistoryItem = {
      date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      score: result.sentimentScore,
      label: result.sentimentLabel
    };
    setHistory(prev => [...prev.slice(-19), newHistoryItem]);

    // Update sector scores
    setSectorScores(prev => {
      const next = { ...prev };
      result.affectedSectors.forEach(sector => {
        if (next[sector]) {
          next[sector] = {
            total: next[sector].total + result.sentimentScore,
            count: next[sector].count + 1
          };
        }
      });
      return next;
    });

    // Update opportunities
    if (result.opportunities) {
      setAllOpportunities(prev => [...result.opportunities, ...prev].slice(0, 15));
    }
  };

  useEffect(() => {
    fetchNews().then(news => {
      if (news && news.length > 0) {
        runBatchAnalysis(news);
      }
    });
  }, []);

  const handleAnalyze = async (article: NewsArticle | { title: string, content: string }) => {
    setAnalyzing(true);
    try {
      const result = await analyzeSentiment(article.title, article.content || article.title);
      setAnalysis(result);
      updateGlobalState(result);
    } catch (err) {
      console.error(err);
      setError("Analysis failed. Please try again.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleCustomAnalyze = () => {
    if (!customNews.trim()) return;
    handleAnalyze({ title: "Custom Analysis", content: customNews });
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-emerald-600';
    if (score >= 6) return 'text-emerald-500';
    if (score >= 4) return 'text-slate-500';
    return 'text-rose-600';
  };

  const moodIndex = history.length > 0 
    ? (history.reduce((acc, curr) => acc + curr.score, 0) / history.length).toFixed(1)
    : null;

  const getMoodInterpretation = (score: number) => {
    if (score >= 8) return 'Strongly Bullish';
    if (score >= 6) return 'Moderately Bullish';
    if (score >= 4) return 'Neutral / Mixed';
    return 'Bearish Sentiment';
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
              <Activity size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">FinPulse AI</h1>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Financial Intelligence Dashboard</p>
            </div>
          </div>
          
          {moodIndex && (
            <div className="hidden md:flex items-center gap-4 bg-indigo-50 px-4 py-2 rounded-xl border border-indigo-100">
              <div className="text-right">
                <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Market Mood Index</p>
                <p className="text-sm font-bold text-indigo-700">{moodIndex} / 10 • <span className="text-indigo-500">{getMoodInterpretation(parseFloat(moodIndex))}</span></p>
              </div>
            </div>
          )}

          {batchAnalyzing && (
            <div className="hidden lg:flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-xl border border-slate-200 min-w-[200px]">
              <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-indigo-500" 
                  initial={{ width: 0 }}
                  animate={{ width: `${batchProgress}%` }}
                />
              </div>
              <span className="text-[10px] font-bold text-slate-500 whitespace-nowrap">Batch Processing {batchProgress}%</span>
            </div>
          )}

          <div className="flex items-center gap-4">
            <button 
              onClick={fetchNews}
              disabled={loading}
              className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw size={20} className={cn(loading && "animate-spin")} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Panel 1: News Feed */}
          <div className="lg:col-span-4 space-y-8">
            <Card title="Latest Headlines (RSS)" icon={Newspaper}>
              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                {error && (
                  <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-sm flex items-start gap-3">
                    <AlertCircle size={18} className="shrink-0 mt-0.5" />
                    <p>{error}</p>
                  </div>
                )}
                
                {loading ? (
                  Array(8).fill(0).map((_, i) => (
                    <div key={i} className="animate-pulse space-y-2 p-3">
                      <div className="h-4 bg-slate-100 rounded w-3/4" />
                      <div className="h-3 bg-slate-50 rounded w-1/2" />
                    </div>
                  ))
                ) : (
                  articles.map((article, idx) => (
                    <motion.div 
                      key={idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      onClick={() => {
                        setSelectedArticle(article);
                        handleAnalyze(article);
                      }}
                      className={cn(
                        "p-3 rounded-xl cursor-pointer transition-all border border-transparent hover:border-slate-200 hover:bg-slate-50 group",
                        selectedArticle?.link === article.link && "bg-indigo-50 border-indigo-100"
                      )}
                    >
                      <p className="text-sm font-medium text-slate-800 line-clamp-2 group-hover:text-indigo-600 transition-colors">
                        {article.title}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{article.source}</span>
                        <span className="text-[10px] text-slate-300">{new Date(article.pubDate).toLocaleDateString()}</span>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </Card>

            <Card title="Custom Analysis" icon={Plus}>
              <div className="space-y-4">
                <textarea 
                  value={customNews}
                  onChange={(e) => setCustomNews(e.target.value)}
                  placeholder="Paste a news article or headline here..."
                  className="w-full h-32 p-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none"
                />
                <button 
                  onClick={handleCustomAnalyze}
                  disabled={analyzing || !customNews.trim()}
                  className="w-full py-2.5 bg-slate-900 text-white rounded-xl font-semibold text-sm hover:bg-slate-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {analyzing ? <RefreshCw size={16} className="animate-spin" /> : <Search size={16} />}
                  Analyze Custom News
                </button>
              </div>
            </Card>
          </div>

          {/* Panel 2: Sentiment Analysis */}
          <div className="lg:col-span-8 space-y-8">
            <AnimatePresence mode="wait">
              {analyzing ? (
                <motion.div 
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-[400px] flex flex-col items-center justify-center text-slate-400 gap-4 bg-white border border-slate-200 rounded-3xl"
                >
                  <div className="relative">
                    <Activity size={48} className="text-indigo-500 animate-pulse" />
                    <div className="absolute inset-0 border-4 border-indigo-100 border-t-indigo-500 rounded-full animate-spin" />
                  </div>
                  <p className="font-medium animate-pulse">AI is processing financial reasoning...</p>
                </motion.div>
              ) : analysis ? (
                <motion.div 
                  key="analysis"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-8"
                >
                  <Card className="border-l-4 border-l-indigo-500" title="AI Sentiment Analysis" icon={Activity}>
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-3">
                          <Badge variant={analysis.sentimentLabel.toLowerCase() as any}>
                            {analysis.sentimentLabel}
                          </Badge>
                          <span className="text-xs text-slate-400 font-mono">MODEL: GEMINI-3-FLASH</span>
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 leading-tight">
                          {analysis.headline}
                        </h2>
                      </div>
                      <div className="flex flex-col items-center bg-slate-50 p-4 rounded-2xl border border-slate-100 min-w-[120px]">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Score</span>
                        <span className={cn("text-4xl font-black", getScoreColor(analysis.sentimentScore))}>
                          {analysis.sentimentScore}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">/ 10</span>
                      </div>
                    </div>

                    <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-6">
                        <div>
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <Activity size={14} /> Financial Reasoning
                          </h4>
                          <p className="text-slate-600 text-sm leading-relaxed">
                            {analysis.explanation}
                          </p>
                        </div>
                        
                        <div>
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Key Entities</h4>
                          <div className="flex flex-wrap gap-2">
                            {analysis.keyEntities.map((e, i) => (
                              <span key={i} className="px-2 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold rounded uppercase tracking-wider">
                                {e}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="bg-slate-50/50 rounded-2xl p-6 border border-slate-100 space-y-4">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                          <TrendingUp size={14} /> Market Impact Prediction
                        </h4>
                        
                        <div className="space-y-3">
                          <div className="flex items-start gap-3">
                            <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                              <TrendingUp size={14} />
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase">Upside Potential</p>
                              <p className="text-xs text-slate-700 font-medium">{analysis.reasoning.up.join(', ')}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-start gap-3">
                            <div className="w-6 h-6 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                              <TrendingDown size={14} />
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase">Downside Risk</p>
                              <p className="text-xs text-slate-700 font-medium">{analysis.reasoning.down.join(', ')}</p>
                            </div>
                          </div>
                        </div>

                        <div className="pt-4 border-t border-slate-200">
                          <p className="text-xs text-slate-600 font-medium mb-1 uppercase tracking-tighter">AI Prediction:</p>
                          <p className="text-sm text-indigo-600 font-semibold leading-relaxed">
                            {analysis.predictedMarketReaction}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ) : (
                <div className="h-[400px] flex flex-col items-center justify-center text-slate-300 border-2 border-dashed border-slate-200 rounded-3xl bg-white">
                  <BarChart3 size={48} className="mb-4 opacity-20" />
                  <p className="font-medium">Select a headline to run AI sentiment analysis</p>
                </div>
              )}
            </AnimatePresence>

            {/* Panel 3: Visualizations */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card title="Sector Sentiment Heatmap" icon={BarChart3}>
                <div className="space-y-3">
                  {Object.entries(sectorScores).map(([sector, data]) => {
                    const sectorData = data as { total: number, count: number };
                    const avg = sectorData.count > 0 ? sectorData.total / sectorData.count : 0;
                    const color = avg >= 7 ? 'bg-emerald-500' : avg >= 4 ? 'bg-amber-400' : avg > 0 ? 'bg-rose-500' : 'bg-slate-200';
                    return (
                      <div key={sector} className="flex items-center gap-3">
                        <span className="text-xs font-medium text-slate-600 w-24 shrink-0">{sector}</span>
                        <div className="flex-1 h-6 bg-slate-100 rounded-md overflow-hidden relative">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${avg * 10}%` }}
                            className={cn("h-full transition-colors", color)}
                          />
                          <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white drop-shadow-sm">
                            {avg > 0 ? avg.toFixed(1) : 'No Data'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>

              <Card title="Sentiment Trend Chart" icon={Activity}>
                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={history.length > 0 ? history : [
                      { date: 'T-3', score: 5 },
                      { date: 'T-2', score: 6 },
                      { date: 'T-1', score: 4 },
                      { date: 'Now', score: 7 },
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis 
                        dataKey="date" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 10, fill: '#94a3b8' }} 
                      />
                      <YAxis 
                        domain={[0, 10]} 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 10, fill: '#94a3b8' }} 
                      />
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="score" 
                        stroke="#6366f1" 
                        strokeWidth={3} 
                        dot={{ r: 4, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }}
                        activeDot={{ r: 6, strokeWidth: 0 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>

            {/* Panel 4: AI Opportunity Radar */}
            <Card title="AI Opportunity Radar" icon={Search}>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="pb-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Company</th>
                      <th className="pb-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sector</th>
                      <th className="pb-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Bullish Prob.</th>
                      <th className="pb-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Reasoning</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {allOpportunities.length > 0 ? (
                      allOpportunities.map((opp, idx) => (
                        <motion.tr 
                          key={idx}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className="group hover:bg-slate-50/50 transition-colors"
                        >
                          <td className="py-4 pr-4">
                            <span className="text-sm font-bold text-slate-900">{opp.company}</span>
                          </td>
                          <td className="py-4 pr-4">
                            <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded uppercase">{opp.sector}</span>
                          </td>
                          <td className="py-4 pr-4">
                            <div className="flex items-center gap-2">
                              <div className="w-12 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div 
                                  className={cn(
                                    "h-full",
                                    opp.probability >= 70 ? "bg-emerald-500" : opp.probability >= 40 ? "bg-amber-400" : "bg-rose-500"
                                  )}
                                  style={{ width: `${opp.probability}%` }}
                                />
                              </div>
                              <span className="text-xs font-mono font-bold text-slate-600">{opp.probability}%</span>
                            </div>
                          </td>
                          <td className="py-4">
                            <p className="text-xs text-slate-500 line-clamp-1 group-hover:line-clamp-none transition-all">{opp.reason}</p>
                          </td>
                        </motion.tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-slate-300 italic text-sm">
                          No opportunities identified yet. Run analysis to populate radar.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-sm text-slate-400">
            Powered by Gemini 3 Flash & Google News RSS • No Paid API Keys Required
          </p>
        </div>
      </footer>
    </div>
  );
}
