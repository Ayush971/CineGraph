<div align="center">

# 🎬 CineGraph

### *Track films. Discover stories. Build your cinematic identity.*

A premium movie tracking and social platform inspired by the magic of cinema — built with a cinematic design language that treats every screen like a dark theater illuminated by a projector beam.

[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://react.dev/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.128-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![TMDB](https://img.shields.io/badge/TMDB-API-01D277?style=for-the-badge&logo=themoviedatabase&logoColor=white)](https://www.themoviedb.org/)

</div>

---

## ✨ Features

### 🎥 Movie Discovery
- **Browse & Search** — explore trending, popular, and top-rated movies powered by the TMDB API
- **Detailed Movie Pages** — full cast & crew, OTT availability, ratings, and recommendations
- **Smart Recommendations** — personalized movie suggestions based on your watch history

### 📓 Personal Tracking
- **Watch Diary** — log every film you watch with dates, ratings, and personal notes
- **Star Ratings** — rate movies on a granular scale
- **Curated Lists** — create, manage, and share custom movie collections
- **List Discovery** — explore lists created by other users in the community

### 📊 Analytics & Insights
- **Viewing Analytics** — charts and stats on your watching habits (genres, ratings distribution, watch frequency)
- **Year in Review** — a cinematic, scroll-driven recap of your year in film (powered by GSAP + ScrollTrigger)
- **Achievements** — unlock badges and milestones as you track your journey

### 🤝 Social
- **Activity Feed** — see what friends are watching, rating, and adding to lists
- **User Profiles** — public profiles showcasing watch stats, favorites, and activity
- **Follow System** — follow other cinephiles and build your community
- **Comments & Likes** — discuss films and engage with diary entries and lists

### 🎨 Design Language — *"PROJECTION"*
- **Cinematic UI** — warm near-black palette with tungsten & daylight accent lighting
- **3D Poster Wall** — interactive Three.js landing hero with floating movie posters
- **Film Grain Overlay** — subtle SVG noise for a celluloid texture
- **Smooth Animations** — Framer Motion page transitions, Lenis smooth scrolling
- **Accessible** — full `prefers-reduced-motion` support with opacity-only fallbacks

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| **React 19** + **TypeScript** | UI framework |
| **Vite 7** | Build tool & dev server |
| **Tailwind CSS v4** | Styling (CSS-first `@theme`) |
| **Framer Motion** | Page transitions & micro-animations |
| **React Three Fiber** + **Three.js** | 3D poster wall on landing page |
| **Lenis** | Smooth scroll |
| **Chart.js** | Analytics visualizations |
| **React Router v7** | Client-side routing |

### Backend
| Technology | Purpose |
|---|---|
| **FastAPI** | REST API framework |
| **SQLAlchemy** | ORM & database modeling |
| **PostgreSQL 15** | Primary database |
| **Redis 7** | Caching layer |
| **PyJWT** | Authentication tokens |
| **Uvicorn** | ASGI server |

### Infrastructure
| Technology | Purpose |
|---|---|
| **Docker Compose** | Container orchestration (Postgres + Redis) |
| **TMDB API** | Movie metadata, posters, and discovery |

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** ≥ 18
- **Python** ≥ 3.10
- **Docker** (for PostgreSQL & Redis)
- **TMDB API Key** — [get one free here](https://www.themoviedb.org/settings/api)

### 1. Clone the repo
```bash
git clone https://github.com/Ayush971/CineGraph.git
cd CineGraph
```

### 2. Start the database services
```bash
docker-compose up -d
```
This spins up PostgreSQL (port `5432`) and Redis (port `6379`).

### 3. Set up the backend
```bash
cd backend

# Create and activate a virtual environment
python -m venv venv
# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

Create a `.env` file in `backend/` with:
```env
TMDB_API_READ_ACCESS_TOKEN=your_tmdb_read_access_token
TMDB_API_KEY=your_tmdb_api_key
TMDB_BASE_URL=https://api.themoviedb.org/3
TMDB_IMAGE_BASE_URL=https://image.tmdb.org/t/p
```

Start the server:
```bash
python app/main.py
```
The API will be live at `http://localhost:8000` — interactive docs at [`/docs`](http://localhost:8000/docs).

### 4. Set up the frontend
```bash
cd frontend

# Install dependencies
npm install

# Start the dev server
npm run dev
```
The app will be live at `http://localhost:5173`.

---

## 📡 API Reference

The backend exposes a RESTful API at `http://localhost:8000`. Key endpoint groups:

| Endpoint | Description |
|---|---|
| `/auth` | Registration, login, JWT token management |
| `/movies` | Search, trending, popular, movie details (via TMDB) |
| `/diary` | Log, edit, and retrieve personal watch diary entries |
| `/lists` | Create, manage, and discover curated movie lists |
| `/comments` | Add and retrieve comments on diary entries and lists |
| `/social` | Follow/unfollow users, activity feed |
| `/likes` | Like/unlike diary entries, lists, and comments |
| `/achievements` | User milestones and badges |
| `/analytics` | Watch statistics, genre breakdowns, rating distributions |
| `/recommendations` | Personalized movie suggestions |

> 📖 Full interactive API docs available at [`http://localhost:8000/docs`](http://localhost:8000/docs) (Swagger UI)

---

## 📁 Project Structure

```
CineGraph/
├── frontend/                   # React + Vite frontend
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   │   ├── landing/        # 3D poster wall hero
│   │   │   └── ui/             # Design system primitives
│   │   ├── pages/              # Route-level page components
│   │   ├── context/            # React context (Auth, etc.)
│   │   ├── hooks/              # Custom React hooks
│   │   ├── services/           # API client & service layer
│   │   ├── types/              # TypeScript type definitions
│   │   └── utils/              # Utility functions
│   └── package.json
│
├── backend/                    # FastAPI backend
│   ├── app/
│   │   ├── routes/             # API route handlers
│   │   ├── models/             # SQLAlchemy database models
│   │   ├── schemas/            # Pydantic request/response schemas
│   │   ├── services/           # Business logic layer
│   │   ├── config/             # Database & app configuration
│   │   ├── utils/              # Helper utilities
│   │   └── main.py             # Application entry point
│   └── requirements.txt
│
├── docker-compose.yml          # PostgreSQL + Redis containers
├── DESIGN_LANGUAGE.md          # "PROJECTION" design system spec
└── README.md
```

---

## 🎞️ Design Philosophy

CineGraph follows the **"PROJECTION"** design language — the UI is a dark auditorium, and content is the light:

- **Posters are the light source** — the UI recedes so imagery can project
- **Tungsten acts, Daylight navigates** — two accent colors with strict roles (warm gold for actions, cool blue for wayfinding)
- **Motion is projection** — elements fade up from dark and settle like a film reel stopping, no bouncy cartoon springs

> *Read the full design spec in [DESIGN_LANGUAGE.md](DESIGN_LANGUAGE.md)*

---

## 🤝 Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

## 🙏 Acknowledgments

- Movie data provided by [The Movie Database (TMDB)](https://www.themoviedb.org/)
- Typography: [Bricolage Grotesque](https://fonts.google.com/specimen/Bricolage+Grotesque), [Instrument Sans](https://fonts.google.com/specimen/Instrument+Sans), [Spline Sans Mono](https://fonts.google.com/specimen/Spline+Sans+Mono)

---

<div align="center">
  <sub>Built with 🍿 and a love for cinema</sub>
</div>
