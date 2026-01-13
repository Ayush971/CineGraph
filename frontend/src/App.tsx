import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import MoviesHomePage from './pages/MoviesHomePage';
import SeriesHomePage from './pages/SeriesHomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import MovieDetailPage from './pages/MovieDetailPage';
import SearchPage from './pages/SearchPage';

function App() {
  return (
    <Router>
      <AuthProvider>
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
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  <Route path="/movie/:id" element={<MovieDetailPage />} />
                  <Route path="/search" element={<SearchPage />} />
                </Routes>
              </div>
            }
          />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;