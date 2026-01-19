import { useState, useRef, useEffect } from 'react';
import { chatWithAI, parseTaskCompletionIntent } from '../../services/geminiService';
import './AIChatBot.css';

function AIChatBot({ context, tasks, year, month, onToggleCompletion }) {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'assistant', content: "Hi! I'm your AI productivity assistant. Ask me anything about your habits, progress, or tips to improve! 🚀\n\nYou can also tell me things like:\n• \"I completed exercise today\"\n• \"Done with meditation on Jan 15\"" }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [pendingAction, setPendingAction] = useState(null);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, pendingAction]);

    // Lock body scroll when chat is open on mobile
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    const handleConfirmAction = () => {
        if (pendingAction && onToggleCompletion) {
            if (pendingAction.allTasks) {
                // Mark all tasks complete
                pendingAction.tasks.forEach(task => {
                    onToggleCompletion(task.id, pendingAction.day);
                });
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: `✅ Done! I've marked all ${pendingAction.tasks.length} tasks as complete for day ${pendingAction.day}. Amazing work! 🎉💪`
                }]);
            } else {
                // Mark single task complete
                onToggleCompletion(pendingAction.task.id, pendingAction.day);
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: `✅ Done! I've marked "${pendingAction.task.name}" as complete for day ${pendingAction.day}. Keep up the great work! 💪`
                }]);
            }
        }
        setPendingAction(null);
    };

    const handleCancelAction = () => {
        setMessages(prev => [...prev, {
            role: 'assistant',
            content: "No problem! Let me know if you need anything else."
        }]);
        setPendingAction(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);

        setIsLoading(true);

        try {
            // First, check if this is a task completion request using LLM
            const currentDay = new Date().getDate();
            const taskIntent = await parseTaskCompletionIntent(userMessage, tasks, currentDay);

            if (taskIntent) {
                // Found a task completion intent - ask for confirmation
                setPendingAction(taskIntent);

                if (taskIntent.allTasks) {
                    // All tasks confirmation
                    setMessages(prev => [...prev, {
                        role: 'assistant',
                        content: `I understood that you want to mark ALL tasks as complete:`,
                        showConfirm: true,
                        isAllTasks: true,
                        taskCount: taskIntent.tasks.length,
                        day: taskIntent.day
                    }]);
                } else {
                    // Single task confirmation
                    setMessages(prev => [...prev, {
                        role: 'assistant',
                        content: `I understood that you want to mark a task as complete:`,
                        showConfirm: true,
                        taskName: taskIntent.task.name,
                        day: taskIntent.day
                    }]);
                }
                setIsLoading(false);
                return;
            }

            // Not a task completion request - regular chat
            const response = await chatWithAI(userMessage, context);
            setMessages(prev => [...prev, { role: 'assistant', content: response }]);
        } catch (error) {
            console.error("Error in AI chat:", error);
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: "Sorry, I couldn't process that request. Please try again."
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const quickQuestions = [
        "How can I improve?",
        "What's my best habit?",
        "Give me a tip",
    ];

    return (
        <>
            <button
                className={`chat-toggle ${isOpen ? 'open' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Toggle AI Chat"
            >
                {isOpen ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                        <circle cx="12" cy="10" r="1" fill="currentColor" />
                        <circle cx="8" cy="10" r="1" fill="currentColor" />
                        <circle cx="16" cy="10" r="1" fill="currentColor" />
                    </svg>
                )}
            </button>

            <div className={`chat-container ${isOpen ? 'open' : ''}`}>
                <div className="chat-header">
                    <div className="chat-header-info">
                        <div className="chat-avatar">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M12 2a10 10 0 0 1 10 10 10 10 0 0 1-10 10A10 10 0 0 1 2 12 10 10 0 0 1 12 2z" />
                                <circle cx="12" cy="10" r="3" />
                                <path d="M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662" />
                            </svg>
                        </div>
                        <div>
                            <h3>AI Assistant</h3>
                            <span className="chat-status">Powered by Gemini</span>
                        </div>
                    </div>
                    <button
                        className="chat-close-btn"
                        onClick={() => setIsOpen(false)}
                        aria-label="Close chat"
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                <div className="chat-messages">
                    {messages.map((msg, index) => (
                        <div key={index} className={`message ${msg.role}`}>
                            <div className="message-content">
                                {msg.content}
                                {msg.showConfirm && pendingAction && (
                                    <div className="confirm-dialog">
                                        <p>
                                            {msg.isAllTasks ? (
                                                <>Mark <span className="confirm-dialog-task">ALL {msg.taskCount} tasks</span> as complete for <strong>Day {msg.day}</strong>?</>
                                            ) : (
                                                <>Mark <span className="confirm-dialog-task">"{msg.taskName}"</span> as complete for <strong>Day {msg.day}</strong>?</>
                                            )}
                                        </p>
                                        <div className="confirm-dialog-buttons">
                                            <button
                                                className="confirm-btn yes"
                                                onClick={handleConfirmAction}
                                            >
                                                ✓ Yes, mark complete
                                            </button>
                                            <button
                                                className="confirm-btn no"
                                                onClick={handleCancelAction}
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="message assistant">
                            <div className="message-content loading">
                                <span className="dot"></span>
                                <span className="dot"></span>
                                <span className="dot"></span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <div className="quick-questions">
                    {quickQuestions.map((q, i) => (
                        <button
                            key={i}
                            className="quick-btn"
                            onClick={() => setInput(q)}
                            disabled={isLoading}
                        >
                            {q}
                        </button>
                    ))}
                </div>

                <form className="chat-input-form" onSubmit={handleSubmit}>
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask me anything or mark tasks done..."
                        disabled={isLoading}
                        className="chat-input"
                    />
                    <button
                        type="submit"
                        className="send-btn"
                        disabled={!input.trim() || isLoading}
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="22" y1="2" x2="11" y2="13" />
                            <polygon points="22 2 15 22 11 13 2 9 22 2" />
                        </svg>
                    </button>
                </form>
            </div>
        </>
    );
}

export default AIChatBot;
