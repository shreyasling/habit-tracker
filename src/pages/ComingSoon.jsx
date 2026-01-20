import { useNavigate } from 'react-router-dom';
import './ComingSoon.css';

function ComingSoon({ title, description, accentColor = '#f093fb' }) {
    const navigate = useNavigate();

    return (
        <div className="coming-soon-container">
            {/* Animated Background */}
            <div className="cs-background">
                <div className="cs-orb cs-orb-1" style={{ background: `radial-gradient(circle, ${accentColor}40 0%, transparent 70%)` }}></div>
                <div className="cs-orb cs-orb-2" style={{ background: `radial-gradient(circle, ${accentColor}30 0%, transparent 70%)` }}></div>
            </div>

            <div className="cs-content">
                {/* Back Button */}
                <button className="cs-back-btn" onClick={() => navigate('/')}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="19" y1="12" x2="5" y2="12" />
                        <polyline points="12 19 5 12 12 5" />
                    </svg>
                    <span>Back to Home</span>
                </button>

                {/* Main Content */}
                <div className="cs-main">
                    {/* Animated Icon */}
                    <div className="cs-icon-wrapper">
                        <div className="cs-icon-ring"></div>
                        <div className="cs-icon-ring cs-ring-2"></div>
                        <div className="cs-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <circle cx="12" cy="12" r="10" />
                                <path d="M12 6v6l4 2" />
                            </svg>
                        </div>
                    </div>

                    {/* Text Content */}
                    <h1 className="cs-title">{title || "Tomorrow's Plans"}</h1>
                    <p className="cs-subtitle">Coming Soon</p>
                    <p className="cs-description">
                        {description || "We're working hard to bring you an amazing experience. Plan your tomorrow, today. Stay tuned!"}
                    </p>

                    {/* Feature Preview */}
                    <div className="cs-features">
                        <div className="cs-feature">
                            <div className="cs-feature-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                    <line x1="16" y1="2" x2="16" y2="6" />
                                    <line x1="8" y1="2" x2="8" y2="6" />
                                    <line x1="3" y1="10" x2="21" y2="10" />
                                </svg>
                            </div>
                            <span>Schedule Tasks</span>
                        </div>
                        <div className="cs-feature">
                            <div className="cs-feature-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                                    <polyline points="22 4 12 14.01 9 11.01" />
                                </svg>
                            </div>
                            <span>Priority Focus</span>
                        </div>
                        <div className="cs-feature">
                            <div className="cs-feature-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10" />
                                    <polygon points="10 8 16 12 10 16 10 8" />
                                </svg>
                            </div>
                            <span>Quick Start</span>
                        </div>
                    </div>

                    {/* Notify Button */}
                    <button className="cs-notify-btn">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                        </svg>
                        Notify Me When Ready
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ComingSoon;
