import { useNavigate } from 'react-router-dom';

function Sidebar({ currentView, onViewChange, collapsed, onToggleCollapse, mobileOpen, onMobileClose }) {
    const navigate = useNavigate();

    const menuItems = [
        { id: 'dashboard', label: 'Dashboard', icon: DashboardIcon },
        { id: 'transactions', label: 'Transactions', icon: TransactionsIcon },
        { id: 'accounts', label: 'Accounts', icon: AccountsIcon },
        { id: 'analytics', label: 'Analytics', icon: AnalyticsIcon },
        { id: 'investments', label: 'Investments', icon: TrendingUpIcon },
        { id: 'goals', label: 'Goals', icon: GoalsIcon },
        { id: 'history', label: 'History', icon: HistoryIcon },
    ];

    const generalItems = [
        { id: 'settings', label: 'Settings', icon: SettingsIcon },
        { id: 'help', label: 'Help Center', icon: HelpIcon },
    ];

    const handleNavClick = (id) => {
        onViewChange(id);
        if (onMobileClose) {
            onMobileClose();
        }
    };

    return (
        <aside className={`finance-sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
            <div className="sidebar-header">
                <div className="sidebar-logo">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
                    </svg>
                </div>
                {!collapsed && <span className="sidebar-brand">FinanceAI</span>}

                {/* Collapse/Expand button */}
                <button
                    className="sidebar-toggle desktop-only"
                    onClick={onToggleCollapse}
                    title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                        {collapsed ? (
                            <path d="M13 17l5-5-5-5M6 17l5-5-5-5" />
                        ) : (
                            <path d="M11 17l-5-5 5-5M18 17l-5-5 5-5" />
                        )}
                    </svg>
                </button>

                {/* Mobile close button */}
                {mobileOpen && (
                    <button
                        className="sidebar-close mobile-only"
                        onClick={onMobileClose}
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
                            <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                    </button>
                )}
            </div>

            <nav className="sidebar-nav">
                <div className="nav-section">
                    {!collapsed && <div className="nav-section-title">Menu</div>}
                    {menuItems.map(item => (
                        <div
                            key={item.id}
                            className={`nav-item ${currentView === item.id ? 'active' : ''}`}
                            onClick={() => handleNavClick(item.id)}
                            title={collapsed ? item.label : undefined}
                        >
                            <item.icon />
                            {!collapsed && <span>{item.label}</span>}
                        </div>
                    ))}
                </div>

                <div className="nav-section">
                    {!collapsed && <div className="nav-section-title">General</div>}
                    {generalItems.map(item => (
                        <div
                            key={item.id}
                            className={`nav-item ${currentView === item.id ? 'active' : ''}`}
                            onClick={() => handleNavClick(item.id)}
                            title={collapsed ? item.label : undefined}
                        >
                            <item.icon />
                            {!collapsed && <span>{item.label}</span>}
                        </div>
                    ))}
                </div>
            </nav>

            {/* Back to Home */}
            <div className="sidebar-footer">
                <div
                    className="nav-item"
                    onClick={() => navigate('/')}
                    title={collapsed ? 'Back to Home' : undefined}
                >
                    <HomeIcon />
                    {!collapsed && <span>Back to Home</span>}
                </div>
            </div>
        </aside>
    );
}

// Icons
function DashboardIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
    );
}

function TransactionsIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 3L21 7L17 11" />
            <path d="M21 7H9" />
            <path d="M7 13L3 17L7 21" />
            <path d="M3 17H15" />
        </svg>
    );
}

function AccountsIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="4" width="20" height="16" rx="2" />
            <path d="M2 10H22" />
            <path d="M6 16H10" />
        </svg>
    );
}

function AnalyticsIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 20V10" />
            <path d="M12 20V4" />
            <path d="M6 20V14" />
        </svg>
    );
}

function TrendingUpIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
            <polyline points="17 6 23 6 23 12" />
        </svg>
    );
}

function GoalsIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="6" />
            <circle cx="12" cy="12" r="2" />
        </svg>
    );
}

function HistoryIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
        </svg>
    );
}

function SettingsIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
        </svg>
    );
}

function HelpIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
            <path d="M12 17h.01" />
        </svg>
    );
}

function HomeIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
    );
}

export default Sidebar;
