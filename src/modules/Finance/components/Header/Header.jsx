import { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';

function Header({ user, onSearch }) {
    const { state, actions } = useFinance();
    const userName = state.settings?.userName || user?.displayName?.split(' ')[0] || 'there';
    const [searchQuery, setSearchQuery] = useState('');

    // Get greeting based on time of day
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 17) return 'Good Afternoon';
        return 'Good Evening';
    };

    const handleSearch = (e) => {
        const query = e.target.value;
        setSearchQuery(query);
        if (onSearch) {
            onSearch(query);
        }
    };

    return (
        <header className="finance-header">
            <div className="header-left">
                <div className="header-greeting">
                    <h1 className="greeting-text">
                        {getGreeting()}, <span className="highlight">{userName}</span> 👋
                    </h1>
                    <p className="greeting-subtitle">Here's what's happening with your finances today</p>
                </div>
            </div>

            <div className="header-right">
                <div className="search-bar">
                    <SearchIcon />
                    <input
                        type="text"
                        placeholder="Search transactions..."
                        value={searchQuery}
                        onChange={handleSearch}
                    />
                    <span className="shortcut">⌘K</span>
                </div>

                <button className="header-icon-btn" title="Notifications">
                    <BellIcon />
                </button>

                <button
                    className="header-icon-btn"
                    onClick={actions.toggleTheme}
                    title="Toggle theme"
                >
                    {state.settings.theme === 'dark' ? <SunIcon /> : <MoonIcon />}
                </button>

                {user?.photoURL ? (
                    <img src={user.photoURL} alt="Profile" className="user-avatar" />
                ) : (
                    <div className="user-avatar" style={{
                        background: 'var(--fin-accent-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontWeight: 600,
                        fontSize: '16px'
                    }}>
                        {userName.charAt(0).toUpperCase()}
                    </div>
                )}
            </div>
        </header>
    );
}

// Icons
function SearchIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
        </svg>
    );
}

function BellIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 01-3.46 0" />
        </svg>
    );
}

function SunIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="5" />
            <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
        </svg>
    );
}

function MoonIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
        </svg>
    );
}

export default Header;
