import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import AdminLayout from './components/AdminLayout.jsx'
import AdminDashboard from './pages/AdminDashboard.jsx'
import AnimeDetails from './pages/AnimeDetails.jsx'
import Bookmarks from './pages/Bookmarks.jsx'
import Genres from './pages/Genres.jsx'
import History from './pages/History.jsx'
import Home from './pages/Home.jsx'
import Latest from './pages/Latest.jsx'
import Login from './pages/Login.jsx'
import NotFound from './pages/NotFound.jsx'
import Page from './pages/Page.jsx'
import SearchResults from './pages/SearchResults.jsx'
import Trending from './pages/Trending.jsx'
import Watch from './pages/Watch.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="anime/:slug" element={<AnimeDetails />} />
        <Route path="watch/:episodeId" element={<Watch />} />
        <Route path="search" element={<SearchResults />} />
        <Route path="genres" element={<Genres />} />
        <Route path="genres/:genre" element={<Genres />} />
        <Route path="trending" element={<Trending />} />
        <Route path="latest" element={<Latest />} />
        <Route path="bookmarks" element={<Bookmarks />} />
        <Route path="history" element={<History />} />
        <Route path="about-us" element={<Page slug="about" />} />
        <Route path="contact-us" element={<Page slug="contact" />} />
        <Route path="privacy-policy" element={<Page slug="privacy" />} />
        <Route path="terms" element={<Page slug="terms" />} />
        <Route path="login" element={<Login />} />
        <Route path="*" element={<NotFound />} />
      </Route>
      <Route
        path="admin"
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
      </Route>
    </Routes>
  )
}
