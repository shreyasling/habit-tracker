import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { FinanceProvider, useFinance } from './context/FinanceContext';
import Sidebar from './components/Sidebar/Sidebar';
import Header from './components/Header/Header';
import Dashboard from './components/Dashboard/Dashboard';
import Transactions from './components/Transactions/Transactions';
import Accounts from './components/Accounts/Accounts';
import Analytics from './components/Analytics/Analytics';
import History from './components/History/History';
import Settings from './components/Settings/Settings';
import HelpCenter from './components/HelpCenter/HelpCenter';
import Onboarding from './components/Onboarding/Onboarding';
import PayFlow from './components/PayFlow/PayFlow';
import AddExpense from './components/AddExpense/AddExpense';
import CalendarView from './components/Calendar/CalendarView';
import AIChatbot from './components/AIChatbot/AIChatbot';
import Goals from './components/Goals/Goals';
import Investments from './components/Investments/Investments';
import AutoPay from './components/AutoPay/AutoPay';
import './Finance.css';

function FinanceContent({ user }) {
    const { state, actions, hasCompletedOnboarding } = useFinance();
    const navigate = useNavigate();
    const location = useLocation();

    const [showPayFlow, setShowPayFlow] = useState(false);
    const [showAddExpense, setShowAddExpense] = useState(false);
    const [showCalendar, setShowCalendar] = useState(false);
    const [showAIChatbot, setShowAIChatbot] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    // Derive current view from URL path
    const getCurrentView = () => {
        const path = location.pathname.replace('/finance', '').replace('/', '') || 'dashboard';
        return path;
    };

    // Check for mobile
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth <= 768);
            if (window.innerWidth > 768) {
                setMobileSidebarOpen(false);
            }
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Show loading screen while fetching data
    if (state.loading) {
        return (
            <div className="finance-app" data-theme="dark" style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100vh',
                background: 'var(--fin-bg-primary)'
            }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{
                        width: '48px',
                        height: '48px',
                        border: '3px solid var(--fin-border-primary)',
                        borderTopColor: 'var(--fin-accent-primary)',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                        margin: '0 auto 16px'
                    }} />
                    <p style={{ color: 'var(--fin-text-secondary)', fontSize: '14px' }}>
                        Loading your finances...
                    </p>
                    <style>{`
                        @keyframes spin {
                            to { transform: rotate(360deg); }
                        }
                    `}</style>
                </div>
            </div>
        );
    }

    // Show onboarding if user hasn't completed setup
    if (!hasCompletedOnboarding) {
        return <Onboarding user={user} />;
    }

    const handleViewChange = (view) => {
        setMobileSidebarOpen(false);
        if (view === 'dashboard') {
            navigate('/finance');
        } else {
            navigate(`/finance/${view}`);
        }
    };

    const currentView = getCurrentView();

    return (
        <div
            className={`finance-app ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}
            data-theme={state.settings.theme || 'dark'}
        >
            {/* Mobile overlay */}
            {mobileSidebarOpen && (
                <div
                    className="mobile-overlay"
                    onClick={() => setMobileSidebarOpen(false)}
                />
            )}

            <Sidebar
                currentView={currentView}
                onViewChange={handleViewChange}
                collapsed={sidebarCollapsed}
                onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
                mobileOpen={mobileSidebarOpen}
                onMobileClose={() => setMobileSidebarOpen(false)}
            />

            <div className="finance-main">
                {/* Mobile Header */}
                {isMobile && (
                    <div className="mobile-header">
                        <div className="mobile-header-left">
                            <button
                                className="mobile-menu-btn"
                                onClick={() => setMobileSidebarOpen(true)}
                            >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
                                    <rect x="3" y="3" width="7" height="7" rx="1" />
                                    <rect x="14" y="3" width="7" height="7" rx="1" />
                                    <rect x="14" y="14" width="7" height="7" rx="1" />
                                    <rect x="3" y="14" width="7" height="7" rx="1" />
                                </svg>
                            </button>
                            <span className="mobile-title">FinanceAI</span>
                        </div>
                        <div className="mobile-header-right">
                            {/* Theme Toggle Button */}
                            <button
                                className="mobile-theme-btn"
                                onClick={actions.toggleTheme}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: 'var(--fin-text-primary)',
                                    cursor: 'pointer',
                                    padding: '8px',
                                    display: 'flex',
                                    alignItems: 'center'
                                }}
                            >
                                {state.settings.theme === 'dark' ? (
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
                                        <circle cx="12" cy="12" r="5" />
                                        <line x1="12" y1="1" x2="12" y2="3" />
                                        <line x1="12" y1="21" x2="12" y2="23" />
                                        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                                        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                                        <line x1="1" y1="12" x2="3" y2="12" />
                                        <line x1="21" y1="12" x2="23" y2="12" />
                                        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                                        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                                    </svg>
                                ) : (
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
                                        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                                    </svg>
                                )}
                            </button>
                            <button
                                className="mobile-home-btn"
                                onClick={() => navigate('/')}
                                title="Back to Home"
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: 'var(--fin-text-primary)',
                                    cursor: 'pointer',
                                    padding: '8px',
                                    display: 'flex',
                                    alignItems: 'center'
                                }}
                            >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
                                    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                                    <polyline points="9 22 9 12 15 12 15 22" />
                                </svg>
                            </button>
                        </div>
                    </div>
                )}

                <Header user={user} />

                <main className="finance-content">
                    <Routes>
                        <Route
                            index
                            element={
                                <Dashboard
                                    onPayClick={() => setShowPayFlow(true)}
                                    onAddExpenseClick={() => setShowAddExpense(true)}
                                    onCalendarClick={() => setShowCalendar(true)}
                                    onAskAIClick={() => setShowAIChatbot(true)}
                                    onViewChange={handleViewChange}
                                />
                            }
                        />
                        <Route path="transactions" element={<Transactions />} />
                        <Route path="accounts" element={<Accounts />} />
                        <Route path="analytics" element={<Analytics />} />
                        <Route path="history" element={<History />} />
                        <Route path="goals" element={<Goals />} />
                        <Route path="investments" element={<Investments />} />
                        <Route path="autopay" element={<AutoPay />} />
                        <Route path="ai-assistant" element={<AIChatbot onClose={() => navigate('/finance')} />} />
                        <Route path="settings" element={<Settings />} />
                        <Route path="help" element={<HelpCenter />} />
                        <Route
                            path="*"
                            element={
                                <Dashboard
                                    onPayClick={() => setShowPayFlow(true)}
                                    onAddExpenseClick={() => setShowAddExpense(true)}
                                    onCalendarClick={() => setShowCalendar(true)}
                                    onAskAIClick={() => setShowAIChatbot(true)}
                                    onViewChange={handleViewChange}
                                />
                            }
                        />
                    </Routes>
                </main>
            </div>

            {/* Modals */}
            {showPayFlow && <PayFlow onClose={() => setShowPayFlow(false)} />}
            {showAddExpense && <AddExpense onClose={() => setShowAddExpense(false)} />}
            {showCalendar && <CalendarView onClose={() => setShowCalendar(false)} />}
            {showAIChatbot && <AIChatbot onClose={() => setShowAIChatbot(false)} />}
        </div>
    );
}

function Finance({ user }) {
    return (
        <FinanceProvider userId={user?.uid}>
            <FinanceContent user={user} />
        </FinanceProvider>
    );
}

export default Finance;
