import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import Parser from "rss-parser";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const parser = new Parser();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route for fetching news via RSS (No API Key required)
  app.get("/api/news", async (req, res) => {
    try {
      // Google News RSS for financial news
      const feedUrl = "https://news.google.com/rss/search?q=stock+market+finance+when:1d&hl=en-IN&gl=IN&ceid=IN:en";
      const feed = await parser.parseURL(feedUrl);
      
      const articles = feed.items.map(item => ({
        title: item.title,
        link: item.link,
        pubDate: item.pubDate,
        source: item.creator || "Google News",
        content: item.contentSnippet || item.content || "",
      }));

      res.json({ articles });
    } catch (error) {
      console.error("Error fetching RSS news:", error);
      res.status(500).json({ error: "Failed to fetch news from RSS feed" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
