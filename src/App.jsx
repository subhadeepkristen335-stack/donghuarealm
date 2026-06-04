import { useEffect } from 'react'
import { Route, Routes } from 'react-router-dom'
import { doc, getDoc, setDoc, updateDoc, increment } from 'firebase/firestore'
import { db } from './lib/firebase.js'
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
  useEffect(() => {
    const trackView = async () => {
      if (!db || sessionStorage.getItem('viewTracked')) return;
      try {
        const statsRef = doc(db, 'stats', 'traffic');
        const statsDoc = await getDoc(statsRef);
        const now = Date.now();
        const thirtyDays = 30 * 24 * 60 * 60 * 1000;
        
        if (!statsDoc.exists()) {
          await setDoc(statsRef, { views: 1, lastReset: now });
        } else {
          const data = statsDoc.data();
          if (now - data.lastReset > thirtyDays) {
            await updateDoc(statsRef, { views: 1, lastReset: now });
          } else {
            await updateDoc(statsRef, { views: increment(1) });
          }
        }
        sessionStorage.setItem('viewTracked', 'true');
      } catch (e) {
        console.warn('Failed to track view', e);
      }
    };
    trackView();
  }, []);

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
