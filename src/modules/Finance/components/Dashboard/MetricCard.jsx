function MetricCard({ title, value, change, changeType, subtitle }) {
    return (
        <div className="metric-card">
            <div className="metric-header">
                <span className="metric-title">{title}</span>
                <div className="metric-menu">
                    <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                        <circle cx="12" cy="5" r="1.5" />
                        <circle cx="12" cy="12" r="1.5" />
                        <circle cx="12" cy="19" r="1.5" />
                    </svg>
                </div>
            </div>
            <div className="metric-value">{value}</div>
            {change && (
                <span className={`metric-change ${changeType}`}>
                    {change}
                </span>
            )}
            {subtitle && <p className="metric-subtitle">{subtitle}</p>}
        </div>
    );
}

export default MetricCard;
