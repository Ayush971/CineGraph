import { lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import SmoothScroll from "./components/SmoothScroll";
import LoadingSpinner from "./components/LoadingSpinner";
// Landing is the entry point — keep it eager so "/" needs no extra round trip.
import LandingPage from "./pages/LandingPage";

// Every other route is code-split: the initial bundle no longer carries
// chart.js, the analytics pages, or anything else you haven't navigated to.
const MoviesHomePage = lazy(() => import("./pages/MoviesHomePage"));
const SeriesHomePage = lazy(() => import("./pages/SeriesHomePage"));
const DiaryPage = lazy(() => import("./pages/DiaryPage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const RegisterPage = lazy(() => import("./pages/RegisterPage"));
const MovieDetailPage = lazy(() => import("./pages/MovieDetailPage"));
const SearchPage = lazy(() => import("./pages/SearchPage"));
const ListsPage = lazy(() => import("./pages/ListsPage"));
const ListDetailPage = lazy(() => import("./pages/ListDetailPage"));
const ListDiscoverPage = lazy(() => import("./pages/ListDiscoverPage"));
const ActivityFeedPage = lazy(() => import("./pages/ActivityFeedPage"));
const UserProfilePage = lazy(() => import("./pages/UserProfilePage"));
const AchievementsPage = lazy(() => import("./pages/AchievementsPage"));
const AnalyticsPage = lazy(() => import("./pages/AnalyticsPage"));
const YearInReviewPage = lazy(() => import("./pages/YearInReviewPage"));
const RecommendationsPage = lazy(() => import("./pages/RecommendationsPage"));

function App() {
  return (
    <Router>
      <AuthProvider>
        <SmoothScroll />
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

function AppContent() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-void flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <Routes>
      {/* Landing page without navbar */}
      <Route path="/" element={<LandingPage />} />

      {/* All other routes with navbar */}
      <Route
        path="/*"
        element={
          <div className="min-h-screen bg-void">
            <Navbar />
            <Suspense fallback={<LoadingSpinner />}>
              <Routes>
                <Route path="/movies" element={<MoviesHomePage />} />
                <Route path="/series" element={<SeriesHomePage />} />
                <Route path="/diary" element={<DiaryPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/movie/:id" element={<MovieDetailPage />} />
                <Route path="/search" element={<SearchPage />} />
                <Route path="/lists" element={<ListsPage />} />
                <Route path="/lists/discover" element={<ListDiscoverPage />} />
                <Route path="/lists/:id" element={<ListDetailPage />} />
                <Route path="/feed" element={<ActivityFeedPage />} />
                <Route path="/user/:id" element={<UserProfilePage />} />
                <Route
                  path="/recommendations"
                  element={<RecommendationsPage />}
                />
                <Route path="/achievements" element={<AchievementsPage />} />
                <Route path="/analytics" element={<AnalyticsPage />} />
                <Route path="/year-in-review" element={<YearInReviewPage />} />
              </Routes>
            </Suspense>
          </div>
        }
      />
    </Routes>
  );
}

export default App;
