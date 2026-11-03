import { useEffect, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth'
import { api } from '../api'
import Avatar from './Avatar'
import { HomeIcon, LogoIcon, ProfileIcon } from './icons'

export default function Sidebar() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  return (
    <aside className="sidebar">
      <div className="sidebar-inner">
        <NavLink to="/" className="brand" aria-label="X App home">
          <LogoIcon width="28" height="28" />
        </NavLink>

        <nav className="nav">
          <NavLink to="/" end className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            <HomeIcon width="24" height="24" />
            <span>Home</span>
          </NavLink>
          <NavLink
            to={user ? `/u/${user.handle}` : '/login'}
            className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
          >
            <ProfileIcon width="24" height="24" />
            <span>Profile</span>
          </NavLink>
        </nav>

        <button className="btn-primary sidebar-post" onClick={() => navigate('/')}>
          Post
        </button>

        {user ? (
          <div className="account">
            <Avatar name={user.displayName} size={40} />
            <div className="account-text">
              <strong>{user.displayName}</strong>
              <span>@{user.handle}</span>
            </div>
            <button className="link-button" onClick={signOut}>
              Sign out
            </button>
          </div>
        ) : (
          <NavLink to="/login" className="btn-outline sidebar-signin">
            Sign in
          </NavLink>
        )}
      </div>
    </aside>
  )
}

export function RightRail() {
  const [users, setUsers] = useState([])

  useEffect(() => {
    api
      .users()
      .then((data) => setUsers(data.users))
      .catch(() => setUsers([]))
  }, [])

  return (
    <aside className="right-rail">
      <section className="card">
        <h2>Who to follow</h2>
        <ul className="user-list">
          {users.map((person) => (
            <li key={person.handle}>
              <NavLink to={`/u/${person.handle}`} className="user-row">
                <Avatar name={person.displayName} size={40} />
                <span className="user-row-text">
                  <strong>{person.displayName}</strong>
                  <span>@{person.handle}</span>
                </span>
                <span className="user-row-count">{person.postCount}</span>
              </NavLink>
            </li>
          ))}
          {users.length === 0 && <li className="empty-note">No accounts yet.</li>}
        </ul>
      </section>

      <p className="rail-footer">X App · a small demo built with React, Express and Postgres</p>
    </aside>
  )
}
