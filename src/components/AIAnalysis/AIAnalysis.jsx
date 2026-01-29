import { useState } from 'react';
import { analyzeProductivity } from '../../services/geminiService';
import './AIAnalysis.css';

function AIAnalysis({ tasks, completionData, monthStats, taskStats, isVisible, onClose }) {
    const [analysis, setAnalysis] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [hasAnalyzed, setHasAnalyzed] = useState(false);

    const handleAnalyze = async () => {
        setIsLoading(true);
        try {
            const result = await analyzeProductivity(tasks, completionData, monthStats, taskStats);
            setAnalysis(result);
            setHasAnalyzed(true);
        } catch (error) {
            setAnalysis('Unable to generate analysis. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isVisible) return null;

    return (
        <div className="analysis-overlay" onClick={onClose}>
            <div className="analysis-modal animate-scale-in" onClick={e => e.stopPropagation()}>
                <div className="analysis-header">
                    <div className="analysis-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <path d="M12 16v-4M12 8h.01" />
                        </svg>
                    </div>
                    <div>
                        <h2>AI Productivity Analysis</h2>
                        <p>Get personalized insights powered by AI</p>
                    </div>
                    <button className="close-btn" onClick={onClose}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                <div className="analysis-content">
                    {!hasAnalyzed ? (
                        <div className="analysis-prompt">
                            <div className="stats-preview">
                                <div className="stat-item">
                                    <span className="stat-label">Monthly Progress</span>
                                    <span className="stat-value">{monthStats.percentage}%</span>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-label">Tasks Tracked</span>
                                    <span className="stat-value">{tasks.length}</span>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-label">Current Streak</span>
                                    <span className="stat-value">{monthStats.streak} days</span>
                                </div>
                            </div>
                            <p className="analysis-description">
                                Click analyze to get AI-powered insights about your productivity patterns,
                                areas that need improvement, and personalized recommendations.
                            </p>
                            <button
                                className="analyze-btn"
                                onClick={handleAnalyze}
                                disabled={isLoading || tasks.length === 0}
                            >
                                {isLoading ? (
                                    <>
                                        <span className="spinner"></span>
                                        Analyzing...
                                    </>
                                ) : (
                                    <>
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M12 2a10 10 0 0 1 10 10 10 10 0 0 1-10 10A10 10 0 0 1 2 12 10 10 0 0 1 12 2z" />
                                            <path d="M12 6v6l4 2" />
                                        </svg>
                                        Analyze My Progress
                                    </>
                                )}
                            </button>
                            {tasks.length === 0 && (
                                <p className="no-data-warning">Add some tasks first to get meaningful insights!</p>
                            )}
                        </div>
                    ) : (
                        <div className="analysis-result">
                            <div className="result-content">
                                {analysis.split('\n').map((line, i) => {
                                    if (line.startsWith('**') && line.endsWith('**')) {
                                        return <h3 key={i}>{line.replace(/\*\*/g, '')}</h3>;
                                    }
                                    if (line.trim()) {
                                        return <p key={i}>{line}</p>;
                                    }
                                    return <br key={i} />;
                                })}
                            </div>
                            <button
                                className="reanalyze-btn"
                                onClick={handleAnalyze}
                                disabled={isLoading}
                            >
                                {isLoading ? 'Analyzing...' : 'Analyze Again'}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default AIAnalysis;
