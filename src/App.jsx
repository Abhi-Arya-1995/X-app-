import { BrowserRouter, Link, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './auth'
import Sidebar, { RightRail } from './components/Sidebar'
import Home from './pages/Home'
import Login from './pages/Login'
import PostPage from './pages/PostPage'
import Profile from './pages/Profile'

function NotFound() {
  return (
    <section className="login-page">
      <h1>Page not found</h1>
      <p className="login-sub">That page does not exist.</p>
      <Link to="/" className="btn-outline">
        Back home
      </Link>
    </section>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="app-shell">
          <Sidebar />
          <main className="main-column">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/p/:id" element={<PostPage />} />
              <Route path="/u/:handle" element={<Profile />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
          <RightRail />
        </div>
      </BrowserRouter>
    </AuthProvider>
  )
}
