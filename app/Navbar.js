'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Navbar() {
  const pathname = usePathname();
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    // Initial theme setup
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
      setTheme('light');
      document.body.classList.remove('dark-mode');
    } else {
      setTheme('dark');
      document.body.classList.add('dark-mode');
      localStorage.setItem('theme', 'dark');
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
    if (nextTheme === 'light') {
      document.body.classList.remove('dark-mode');
    } else {
      document.body.classList.add('dark-mode');
    }
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-glass sticky-top py-3">
      <div className="container">
        <Link href="/" className="navbar-brand d-flex align-items-center">
          <i className="fas fa-heartbeat me-2 fs-4"></i>Arogya AI
        </Link>
        <button
          className="navbar-toggler border-0"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav mx-auto mb-2 mb-lg-0 gap-1">
            <li className="nav-item">
              <Link
                href="/dashboard"
                className={`nav-link ${pathname.startsWith('/dashboard') ? 'active' : ''}`}
              >
                <i className="fas fa-chart-pie me-1"></i>Dashboard
              </Link>
            </li>
            <li className="nav-item">
              <Link
                href="/chat"
                className={`nav-link ${pathname.startsWith('/chat') ? 'active' : ''}`}
              >
                <i className="fas fa-comment-dots me-1"></i>Chat Assistant
              </Link>
            </li>
            <li className="nav-item">
              <Link
                href="/meal-planner"
                className={`nav-link ${pathname.startsWith('/meal-planner') ? 'active' : ''}`}
              >
                <i className="fas fa-utensils me-1"></i>Meal Planner
              </Link>
            </li>
            <li className="nav-item">
              <Link
                href="/profiles"
                className={`nav-link ${pathname.startsWith('/profiles') ? 'active' : ''}`}
              >
                <i className="fas fa-users-cog me-1"></i>Family Profiles
              </Link>
            </li>
            <li className="nav-item">
              <Link
                href="/bmi"
                className={`nav-link ${pathname.startsWith('/bmi') ? 'active' : ''}`}
              >
                <i className="fas fa-calculator me-1"></i>BMI Calculator
              </Link>
            </li>
          </ul>
          <div className="d-flex align-items-center gap-3">
            <button
              className="btn-theme-toggle"
              onClick={toggleTheme}
              title="Toggle Light/Dark Theme"
            >
              <i className={`fas ${theme === 'dark' ? 'fa-sun' : 'fa-moon'}`}></i>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
