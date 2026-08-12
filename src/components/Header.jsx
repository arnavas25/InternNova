import { useState, useEffect, useCallback } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { 
  Moon, Sun, Menu, X, ChevronDown, BookOpen, 
  Layers, Trophy, ShieldCheck, UserCheck, Info, 
  HelpCircle, FileText, Building2, Phone, Sparkles,
  FolderGit2
} from 'lucide-react';
import './header.css';

const NAV_GROUPS = [
  { label: 'Home', href: '/' },
  {
    label: 'Programs',
    dropdown: [
      { label: 'Courses', href: '/courses', icon: BookOpen },
      { label: 'Batches', href: '/batches', icon: Layers },
    ]
  },
  {
    label: 'Student Corner',
    dropdown: [
      { label: 'Projects', href: '/projects', icon: FolderGit2 },
      { label: 'AI Resume Builder', href: '/resume-builder', icon: Sparkles },
      { label: 'Hall of Fame', href: '/hall-of-fame', icon: Trophy },
      { label: 'Verify Certificate', href: '/verify', icon: ShieldCheck },
      { label: 'Campus Ambassador', href: '/ambassador', icon: UserCheck },
    ]
  },
  {
    label: 'Company',
    dropdown: [
      { label: 'Hire Talent', href: '/hire-talent', icon: Building2 },
      { label: 'About Us', href: '/about', icon: Info },
      { label: 'Blog', href: '/blog', icon: FileText },
      { label: 'FAQ', href: '/faq', icon: HelpCircle },
    ]
  }
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dark, setDark] = useState(() => {
    return localStorage.getItem('theme') !== 'light';
  });

  useEffect(() => {
    document.body.classList.toggle('light-theme', !dark);
  }, [dark]);

  const [activeDropdown, setActiveDropdown] = useState(null);
  const [expandedMobileMenu, setExpandedMobileMenu] = useState(null);

  // Scroll Handler
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Lock Body Scroll on Mobile Drawer Open & Handle 'Escape' Key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        closeMenu();
        setActiveDropdown(null);
      }
    };

    if (menuOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [menuOpen]);

  const toggleTheme = () => {
    setDark(prev => {
      const next = !prev;
      localStorage.setItem('theme', next ? 'dark' : 'light');
      return next;
    });
  };

  const closeMenu = useCallback(() => {
    setMenuOpen(false);
    setExpandedMobileMenu(null);
  }, []);

  const toggleMobileAccordion = (label) => {
    setExpandedMobileMenu(prev => (prev === label ? null : label));
  };

  return (
    <>
      <header className={`site-header ${scrolled ? 'is-scrolled' : ''}`}>
        {/* Brand Logo */}
        <Link to="/" className="site-logo" onClick={closeMenu}>
          <img src="/logo.png" alt="InternNova" width="140" height="40" />
        </Link>

        {/* Desktop Navigation */}
        <nav className="site-nav" aria-label="Main Navigation">
          {NAV_GROUPS.map((item) => {
            if (item.dropdown) {
              const isDropdownActive = activeDropdown === item.label;
              return (
                <div
                  key={item.label}
                  className="nav-dropdown-wrapper"
                  onMouseEnter={() => setActiveDropdown(item.label)}
                  onMouseLeave={() => setActiveDropdown(null)}
                >
                  <button 
                    className={`nav-dropdown-btn ${isDropdownActive ? 'is-active' : ''}`}
                    aria-expanded={isDropdownActive}
                    aria-haspopup="true"
                  >
                    <span>{item.label}</span>
                    <ChevronDown size={14} className={`chevron-icon ${isDropdownActive ? 'rotate' : ''}`} />
                  </button>

                  {isDropdownActive && (
                    <div className="nav-dropdown-menu">
                      {item.dropdown.map((sub) => {
                        const Icon = sub.icon;
                        return (
                          <NavLink 
                            key={sub.label} 
                            to={sub.href} 
                            className={({ isActive }) => `dropdown-item ${isActive ? 'active' : ''}`}
                          >
                            {Icon && <Icon size={16} className="dropdown-icon" />}
                            <span>{sub.label}</span>
                          </NavLink>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <NavLink 
                key={item.label} 
                to={item.href}
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        {/* Right Action Buttons */}
        <div className="nav-actions">
          <button 
            className="icon-btn theme-toggle" 
            onClick={toggleTheme} 
            aria-label={dark ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {dark ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <div className="desktop-only-btns">
            <Link to="/staff-login" className="btn btn-outline btn-sm nav-login-btn">Staff Login</Link>
            <Link to="/login" className="btn btn-primary btn-sm nav-login-btn">Student Login</Link>
          </div>

          <button 
            className="icon-btn menu-toggle" 
            onClick={() => setMenuOpen(true)} 
            aria-label="Open Navigation Menu"
            aria-expanded={menuOpen}
          >
            <Menu size={22} />
          </button>
        </div>
      </header>

      {/* Mobile Drawer */}
      {menuOpen && (
        <div className="mobile-drawer-overlay" onClick={closeMenu}>
          <div className="mobile-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-drawer-head">
              <Link to="/" className="site-logo" onClick={closeMenu}>
                <img src="/logo.png" alt="InternNova" />
              </Link>
              <button className="icon-btn" onClick={closeMenu} aria-label="Close Menu">
                <X size={22} />
              </button>
            </div>

            <div className="mobile-drawer-body">
              {/* Login Buttons */}
              <div className="mobile-auth-grid">
                <Link to="/login" className="btn btn-primary btn-block" onClick={closeMenu}>Student Login</Link>
                <Link to="/staff-login" className="btn btn-outline btn-block" onClick={closeMenu}>Staff Login</Link>
              </div>

              <div className="mobile-nav-divider" />

              {/* Accordions */}
              <div className="mobile-accordion-list">
                {NAV_GROUPS.map((group) => {
                  if (group.dropdown) {
                    const isOpen = expandedMobileMenu === group.label;
                    return (
                      <div key={group.label} className="mobile-accordion-item">
                        <button
                          className={`mobile-accordion-btn ${isOpen ? 'is-open' : ''}`}
                          onClick={() => toggleMobileAccordion(group.label)}
                          aria-expanded={isOpen}
                        >
                          <span>{group.label}</span>
                          <ChevronDown size={18} className={`accordion-icon ${isOpen ? 'rotate' : ''}`} />
                        </button>

                        {isOpen && (
                          <div className="mobile-accordion-content">
                            {group.dropdown.map((sub) => {
                              const Icon = sub.icon;
                              return (
                                <NavLink 
                                  key={sub.label} 
                                  to={sub.href} 
                                  onClick={closeMenu} 
                                  className={({ isActive }) => `mobile-sub-link ${isActive ? 'active' : ''}`}
                                >
                                  {Icon && <Icon size={18} />}
                                  <span>{sub.label}</span>
                                </NavLink>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  }

                  return (
                    <NavLink 
                      key={group.label} 
                      to={group.href} 
                      className={({ isActive }) => `mobile-single-link ${isActive ? 'active' : ''}`} 
                      onClick={closeMenu}
                    >
                      {group.label}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
