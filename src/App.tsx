
import { useEffect, useState } from 'react'
import './App.css'
import HomePage from './components/HomePage'
import { calculateLoveDays, watchLoveDays } from './utils/loveDays'


type Theme = 'day' | 'night'
type ThemePreference = Theme | 'auto'

function getAutomaticTheme(): Theme {
  const hour = new Date().getHours()
  return hour >= 6 && hour < 18 ? 'day' : 'night'
}

function getSavedPreference(): ThemePreference {
  try {
    const saved = localStorage.getItem('our-universe-theme')

    if (saved === 'day' || saved === 'night') {
      return saved
    }
  } catch {
    // 无法访问浏览器存储时，使用自动模式
  }

  return 'auto'
}

function App() {
  const [loveDays, setLoveDays] = useState(() => calculateLoveDays(new Date()))

  useEffect(() => watchLoveDays(setLoveDays), [])

  const [preference, setPreference] =
  useState<ThemePreference>(getSavedPreference)

const [automaticTheme, setAutomaticTheme] =
  useState<Theme>(getAutomaticTheme)

const theme = preference === 'auto'
  ? automaticTheme
  : preference

useEffect(() => {
  const timer = window.setInterval(() => {
    setAutomaticTheme(getAutomaticTheme())
  }, 60_000)

  return () => window.clearInterval(timer)
}, [])

function changeTheme(next: ThemePreference) {
  setPreference(next)

  try {
    if (next === 'auto') {
      localStorage.removeItem('our-universe-theme')
    } else {
      localStorage.setItem('our-universe-theme', next)
    }
  } catch {
    // 存储不可用时，本次页面内仍可切换
  }
}

  return (
 <main className="love-page" data-theme={theme}>
  {/* 白天模式：独立漂浮爱心 */}
<div className="floating-hearts" aria-hidden="true">
  {Array.from({ length: 18 }, (_, i) => (
    <span
      key={i}
      className="floating-heart"
      style={{
        left: `${(i * 37 + 11) % 100}%`,
        animationDelay: `${-((i * 1.7) % 14)}s`,
        animationDuration: `${10 + (i % 6) * 1.5}s`,
        fontSize: `${14 + (i % 5) * 4}px`,
      }}
    >
      {i % 3 === 0 ? '♥' : '♡'}
    </span>
  ))}
</div>

  
<HomePage loveDays={loveDays} />



  <div className="theme-switcher">
    <button
      type="button"
      onClick={() => changeTheme('day')}
      aria-pressed={preference === 'day'}
    >
      ☀️ 白天
    </button>

    <button
      type="button"
      onClick={() => changeTheme('night')}
      aria-pressed={preference === 'night'}
    >
      🌙 夜晚
    </button>

    <button
      type="button"
      onClick={() => changeTheme('auto')}
      aria-pressed={preference === 'auto'}
    >
      ✨ 自动
    </button>
        </div>

    <div className="love-card">
      <div className="heart">❤️</div>

      <h1>Our Little Universe</h1>
      <p className="subtitle">我们的小宇宙</p>

      <div className="divider">♡　♡　♡</div>

      <p className="label">我们已经在一起</p>

      <div className="days">
        <span className="number">{loveDays}</span>
        <span className="unit">天</span>
      </div>

      <p className="date">2026.08.19 — Forever ♡</p>

      <p className="message">
        世界很大，幸好我们遇见了彼此。
      </p>
    </div>
  </main>
  )
}

export default App
