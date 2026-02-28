# 📊 Financial News Sentiment Analyzer

An AI-powered web application that analyzes financial news headlines or articles and determines their market sentiment using Google Gemini API.

---

## 🚀 Features

- 📰 Analyze financial news articles
- 🤖 AI-powered sentiment classification
- 📈 Sentiment categories:
  - Positive
  - Negative
  - Neutral
- 💡 Explanation-based output (not just labels)
- ⚡ Built with Vite + React + TypeScript
- 🔐 Secure backend integration

---

## 🛠 Tech Stack

### Frontend
- React
- TypeScript
- Vite

### Backend
- Node.js
- Express (if used)
- Gemini API

---

## 📂 Project Structure

```

financial-news-sentiment-analyzer/
│
├── src/
│   ├── App.tsx
│   ├── main.tsx
│   ├── services/
│   │   └── geminiService.ts
│   ├── types.ts
│   └── utils.ts
│
├── server.ts
├── vite.config.ts
├── tsconfig.json
├── package.json
└── .env.example

````

---

## ⚙️ Installation

### 1️⃣ Clone Repository

```bash
git clone https://github.com/your-username/financial-news-sentiment-analyzer.git
cd financial-news-sentiment-analyzer
````

---

### 2️⃣ Install Dependencies

```bash
npm install
```

---

### 3️⃣ Setup Environment Variables

Create a `.env` file:

```
GEMINI_API_KEY=your_api_key_here
```

---

### 4️⃣ Run Development Server

```bash
npm run dev
```

---

## 🔍 How It Works

1. User inputs financial news.
2. Frontend sends text to backend.
3. Backend calls Gemini API.
4. AI analyzes sentiment.
5. Response returned to frontend.
6. Sentiment displayed with explanation.

---

## 📈 Example

Input:

> "Apple stock surges after record-breaking quarterly earnings."

Output:

* Sentiment: Positive
* Explanation: Strong earnings performance indicates financial growth and investor confidence.

---

## 🖼️ Screenshots

<img width="1233" height="684" alt="swrgfewsrgf" src="https://github.com/user-attachments/assets/090361d3-f5e8-4645-a494-d5fa82d9beb7" /> <br/>
<img width="1263" height="833" alt="WSRgf" src="https://github.com/user-attachments/assets/56aeee8e-c75b-40e5-b58b-0856336e6505" /> <br/>

---

## 📌 Future Improvements

* Sentiment score visualization (charts)
* Historical trend tracking
* Real-time news feed integration
* Confidence score display
* Stock ticker auto-detection

---

## 👨‍💻 Author

Developed for AI-powered financial analysis using modern web technologies.

---
