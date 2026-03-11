import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import LandingPage from "./pages/LandingPage";
import MoviesHomePage from "./pages/MoviesHomePage";
import SeriesHomePage from "./pages/SeriesHomePage";
import DiaryPage from "./pages/DiaryPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import MovieDetailPage from "./pages/MovieDetailPage";
import SearchPage from "./pages/SearchPage";
import ListsPage from "./pages/ListsPage";
import ListDetailPage from "./pages/ListDetailPage";
import ListDiscoverPage from "./pages/ListDiscoverPage";
import ActivityFeedPage from "./pages/ActivityFeedPage";
import UserProfilePage from "./pages/UserProfilePage";

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

function AppContent() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-white">
        Loading...
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
          <div className="min-h-screen bg-background">
            <Navbar />
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
            </Routes>
          </div>
        }
      />
    </Routes>
  );
}

export default App;
