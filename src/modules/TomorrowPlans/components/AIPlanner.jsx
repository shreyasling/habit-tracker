import { useState } from 'react';
import { createPortal } from 'react-dom';
import { generatePlanFromText } from '../services/aiService';
import VoiceInput from '../../../components/VoiceInput';
import './AIPlanner.css';

function AIPlanner({ onPlanGenerated, onClose, existingTasks }) {
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [generatedTasks, setGeneratedTasks] = useState(null);
    const [error, setError] = useState('');
    const [interimText, setInterimText] = useState('');

    const handleGenerate = async () => {
        if (!input.trim()) return;

        setLoading(true);
        setError('');

        try {
            const tasks = await generatePlanFromText(input.trim(), existingTasks);
            setGeneratedTasks(tasks);
        } catch (err) {
            setError('Failed to generate plan. Please try again.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleAccept = () => {
        if (generatedTasks) {
            onPlanGenerated(generatedTasks);
        }
    };

    const handleRemoveTask = (index) => {
        setGeneratedTasks(prev => prev.filter((_, i) => i !== index));
    };

    const examplePrompts = [
        "Morning workout, then work on project, lunch break, afternoon meetings",
        "Study for 2 hours, work on assignments, take a break, evening reading",
        "Team standup at 9, coding till lunch, review PRs, documentation in evening"
    ];

    return createPortal(
        <div className="ai-planner-overlay" onClick={onClose}>
            <div className="ai-planner-modal" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="ai-header">
                    <div className="ai-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M12 2a10 10 0 0110 10 10 10 0 01-10 10A10 10 0 012 12 10 10 0 0112 2z" />
                            <circle cx="12" cy="12" r="4" />
                        </svg>
                    </div>
                    <div className="ai-title">
                        <h2>AI Plan Generator</h2>
                        <p>Describe your day and I'll create a schedule</p>
                    </div>
                    <button className="close-btn" onClick={onClose}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="ai-content">
                    {!generatedTasks ? (
                        <>
                            <div className="ai-input-section">
                                <div className="input-with-voice">
                                    <textarea
                                        value={input + (interimText ? ' ' + interimText : '')}
                                        onChange={(e) => setInput(e.target.value)}
                                        placeholder="Describe what you want to accomplish today... or use the mic!"
                                        rows={4}
                                        autoFocus
                                    />
                                    <div className="voice-input-wrapper">
                                        <VoiceInput
                                            onTranscript={(text) => {
                                                setInput(prev => prev + (prev ? ' ' : '') + text);
                                                setInterimText('');
                                            }}
                                            onInterimTranscript={(text) => setInterimText(text)}
                                            language="en-US"
                                            size="medium"
                                            showWaveform={true}
                                            showTimer={true}
                                        />
                                    </div>
                                </div>

                                {error && <div className="ai-error">{error}</div>}

                                <button
                                    className="generate-btn"
                                    onClick={handleGenerate}
                                    disabled={!input.trim() || loading}
                                >
                                    {loading ? (
                                        <>
                                            <div className="btn-spinner" />
                                            Generating...
                                        </>
                                    ) : (
                                        <>
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M12 2a10 10 0 0110 10 10 10 0 01-10 10A10 10 0 012 12 10 10 0 0112 2z" />
                                                <path d="M12 8v8M8 12h8" />
                                            </svg>
                                            Generate Plan
                                        </>
                                    )}
                                </button>
                            </div>

                            <div className="ai-examples">
                                <span className="examples-label">Try an example:</span>
                                <div className="example-chips">
                                    {examplePrompts.map((prompt, i) => (
                                        <button
                                            key={i}
                                            className="example-chip"
                                            onClick={() => setInput(prompt)}
                                        >
                                            {prompt.slice(0, 40)}...
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="ai-results">
                            <div className="results-header">
                                <h3>Generated Schedule</h3>
                                <span className="task-count">{generatedTasks.length} tasks</span>
                            </div>

                            <div className="task-preview-list">
                                {generatedTasks.map((task, index) => (
                                    <div key={index} className="task-preview">
                                        <div className="preview-time">
                                            {task.startTime} - {task.endTime}
                                        </div>
                                        <div className="preview-content">
                                            <h4>{task.title}</h4>
                                            {task.description && <p>{task.description}</p>}
                                        </div>
                                        <button
                                            className="remove-task-btn"
                                            onClick={() => handleRemoveTask(index)}
                                        >
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <line x1="18" y1="6" x2="6" y2="18" />
                                                <line x1="6" y1="6" x2="18" y2="18" />
                                            </svg>
                                        </button>
                                    </div>
                                ))}
                            </div>

                            <div className="results-actions">
                                <button
                                    className="try-again-btn"
                                    onClick={() => setGeneratedTasks(null)}
                                >
                                    Try Again
                                </button>
                                <button
                                    className="accept-btn"
                                    onClick={handleAccept}
                                    disabled={generatedTasks.length === 0}
                                >
                                    Add to Plan
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
}

export default AIPlanner;
