export interface NewsArticle {
  title: string;
  link: string;
  pubDate: string;
  source: string;
  content: string;
}

export interface Opportunity {
  company: string;
  sector: string;
  probability: number;
  reason: string;
}

export interface SentimentAnalysis {
  headline: string;
  sentimentScore: number; // 1-10
  sentimentLabel: 'Bullish' | 'Bearish' | 'Neutral';
  explanation: string;
  affectedSectors: string[];
  keyEntities: string[];
  predictedMarketReaction: string;
  bullishProbability: number; // 0-100
  opportunities: Opportunity[];
  reasoning: {
    up: string[];
    down: string[];
    why: string;
  };
}

export interface HistoricalData {
  date: string;
  score: number;
  label: string;
}
