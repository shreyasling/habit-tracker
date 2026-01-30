import { useNavigate } from 'react-router-dom';
import './Home.css';

// Module configuration - simple colors only
const modules = [
    {
        id: 'productivity-tracker',
        title: 'Productivity Tracker',
        description: 'Track habits, build streaks, achieve goals',
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                <path d="M9 14l2 2 4-4" />
            </svg>
        ),
        route: '/productivity-tracker',
        status: 'active',
        color: '#22c55e' // Green
    },
    {
        id: 'tomorrow-plans',
        title: "Tomorrow's Plans",
        description: 'Plan ahead for a productive tomorrow',
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
            </svg>
        ),
        route: '/tomorrow-plans',
        status: 'active',
        color: '#a855f7' // Purple
    },
    {
        id: 'finance',
        title: 'Financial Management',
        description: 'Track expenses, budgets, and goals with AI insights',
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
            </svg>
        ),
        route: '/finance',
        status: 'active',
        color: '#a855f7' // Purple
    }
];

function Home({ user, onLogout }) {
    const navigate = useNavigate();

    const handleModuleClick = (module) => {
        if (module.status === 'active') {
            navigate(module.route);
        }
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 'coming-soon':
                return 'Coming Soon';
            case 'planned':
                return 'Planned';
            default:
                return null;
        }
    };

    return (
        <div className="home-container">
            {/* Header */}
            <header className="home-header">
                <div className="header-content">
                    <div className="brand">
                        <div className="brand-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polygon points="12 2 2 7 12 12 22 7 12 2" />
                                <polyline points="2 17 12 22 22 17" />
                                <polyline points="2 12 12 17 22 12" />
                            </svg>
                        </div>
                        <h1>My App</h1>
                    </div>

                    <div className="user-section">
                        {user?.photoURL && (
                            <img src={user.photoURL} alt="Profile" className="user-avatar" />
                        )}
                        <span className="user-name">{user?.displayName || 'User'}</span>
                        <button className="logout-btn" onClick={onLogout} title="Sign out">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                                <polyline points="16 17 21 12 16 7" />
                                <line x1="21" y1="12" x2="9" y2="12" />
                            </svg>
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="home-main">
                <div className="welcome-section">
                    <h2 className="welcome-title">
                        Welcome back, <span className="highlight">{user?.displayName?.split(' ')[0] || 'there'}</span>
                    </h2>
                    <p className="welcome-subtitle">Choose a module to get started</p>
                </div>

                <div className="modules-grid">
                    {modules.map((module) => (
                        <div
                            key={module.id}
                            className={`module-card ${module.status}`}
                            onClick={() => handleModuleClick(module)}
                            style={{ '--module-color': module.color }}
                        >
                            {/* Status Badge */}
                            {getStatusLabel(module.status) && (
                                <div className="status-badge">
                                    {getStatusLabel(module.status)}
                                </div>
                            )}

                            {/* Icon */}
                            <div className="module-icon">
                                {module.icon}
                            </div>

                            {/* Content */}
                            <h3 className="module-title">{module.title}</h3>
                            <p className="module-description">{module.description}</p>
                        </div>
                    ))}
                </div>
            </main>

            {/* Footer */}
            <footer className="home-footer">
                <p>Built with ❤️ for productivity</p>
            </footer>
        </div>
    );
}

export default Home;
