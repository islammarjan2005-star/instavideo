# SyncView - AI-Powered Comparative Video Learning

SyncView is an AI-powered video player that lets users learn or explore a topic by watching multiple YouTube videos at once—intelligently interwoven into a single viewing experience.

## Features

- **Multi-Video Comparison**: Watch multiple YouTube videos on the same topic, intelligently aligned
- **AI-Powered Analysis**: Automatically identifies alignment points, convergence, and divergence between videos
- **Smart Switching**: Seamlessly switches between videos when they cover the same concept
- **Visual Timeline**: See all segments and video perspectives at a glance
- **Manual Override**: Take control and switch between videos manually at any time
- **Keyboard Shortcuts**: Full keyboard navigation support

## Use Cases

- **Academic Learning**: Math, statistics, coding, economics - see multiple explanations converge
- **Commentary & Debates**: Compare perspectives on reactions, discussions, and opinions
- **Sports Analysis**: Watch multiple analysts break down the same play or game
- **Tech Tutorials**: Learn from different teaching styles on the same concept

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Optional: AI-Powered Analysis

For enhanced AI analysis of video transcripts, add an OpenAI API key:

```bash
# Create .env.local file
cp .env.example .env.local

# Add your OpenAI API key
OPENAI_API_KEY=your_api_key_here
```

Without an API key, SyncView uses heuristic-based analysis which still provides a great experience.

## How It Works

1. **Enter Videos**: Paste 2-6 YouTube video URLs on the same topic
2. **AI Analysis**: The app fetches transcripts and analyzes them for alignment points
3. **Watch & Compare**: Experience a unified viewing where videos are intelligently interweaved
4. **Gain Understanding**: See where explanations converge, diverge, and offer unique insights

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Space` / `K` | Play/Pause |
| `←` | Previous segment |
| `→` | Next segment |
| `M` | Mute/Unmute |
| `A` | Toggle auto-switch |

## Tech Stack

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **YouTube IFrame API** - Video embedding and control
- **OpenAI API** (optional) - AI-powered transcript analysis
- **youtube-transcript** - Transcript fetching

## Project Structure

```
├── app/
│   ├── api/
│   │   ├── analyze/     # AI analysis endpoint
│   │   └── transcript/  # Transcript fetching
│   ├── player/          # Video player page
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx         # Home/input page
├── components/
│   ├── ComparativePlayer.tsx  # Main player logic
│   ├── Timeline.tsx           # Visual timeline
│   ├── VideoThumbnails.tsx    # Video switcher
│   └── YouTubeEmbed.tsx       # YouTube player wrapper
├── lib/
│   ├── types.ts         # TypeScript types
│   ├── youtube.ts       # YouTube utilities
│   └── transcript.ts    # Transcript utilities
└── ...config files
```

## License

MIT
