import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { chatAboutTasks } from '../services/aiService';
import VoiceInput from '../../../components/VoiceInput';
import './PlanChatbot.css';

function PlanChatbot({ tasks, onClose }) {
    const [messages, setMessages] = useState([
        {
            role: 'assistant',
            content: tasks.length > 0
                ? `Hey! You have ${tasks.length} tasks today. Ask me anything about your schedule!`
                : "Hi! You don't have any tasks planned yet. Would you like some planning tips?"
        }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [interimText, setInterimText] = useState('');
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!input.trim() || loading) return;

        const userMessage = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setLoading(true);

        try {
            const response = await chatAboutTasks(userMessage, tasks, messages);
            setMessages(prev => [...prev, { role: 'assistant', content: response }]);
        } catch (error) {
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: "Sorry, I couldn't process that. Please try again."
            }]);
        } finally {
            setLoading(false);
        }
    };

    const quickQuestions = [
        "What's my next task?",
        "How many tasks left?",
        "Summary of today"
    ];

    const handleQuickQuestion = (question) => {
        setInput(question);
    };

    return createPortal(
        <div className="chatbot-panel">
            {/* Header */}
            <div className="chatbot-header">
                <div className="chatbot-title">
                    <div className="bot-avatar">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
                        </svg>
                    </div>
                    <div>
                        <h3>Plan Assistant</h3>
                        <span className="status">Online</span>
                    </div>
                </div>
                <button className="close-btn" onClick={onClose}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                </button>
            </div>

            {/* Messages */}
            <div className="chatbot-messages">
                {messages.map((msg, index) => (
                    <div key={index} className={`message ${msg.role}`}>
                        {msg.role === 'assistant' && (
                            <div className="message-avatar">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10" />
                                    <circle cx="12" cy="12" r="4" />
                                </svg>
                            </div>
                        )}
                        <div className="message-content">{msg.content}</div>
                    </div>
                ))}
                {loading && (
                    <div className="message assistant">
                        <div className="message-avatar">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" />
                                <circle cx="12" cy="12" r="4" />
                            </svg>
                        </div>
                        <div className="message-content typing">
                            <span></span>
                            <span></span>
                            <span></span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Quick Questions */}
            {messages.length <= 2 && (
                <div className="quick-questions">
                    {quickQuestions.map((q, i) => (
                        <button
                            key={i}
                            className="quick-q"
                            onClick={() => handleQuickQuestion(q)}
                        >
                            {q}
                        </button>
                    ))}
                </div>
            )}

            {/* Input */}
            <form className="chatbot-input" onSubmit={handleSubmit}>
                <VoiceInput
                    onTranscript={(text) => {
                        setInput(prev => prev + (prev ? ' ' : '') + text);
                        setInterimText('');
                    }}
                    onInterimTranscript={(text) => setInterimText(text)}
                    language="en-US"
                    size="small"
                    showWaveform={false}
                    showTimer={false}
                    disabled={loading}
                />
                <input
                    type="text"
                    value={input + (interimText ? ' ' + interimText : '')}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask about your tasks... or tap mic!"
                    disabled={loading}
                />
                <button type="submit" disabled={!input.trim() || loading}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="22" y1="2" x2="11" y2="13" />
                        <polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                </button>
            </form>
        </div>,
        document.body
    );
}

export default PlanChatbot;
