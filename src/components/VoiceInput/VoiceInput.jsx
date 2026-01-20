import { useState, useEffect, useCallback } from 'react';
import useVoiceRecognition from './useVoiceRecognition';
import './VoiceInput.css';

/**
 * VoiceInput Component
 * ChatGPT-style mic toggle button with speech-to-text conversion
 * 
 * @param {Object} props
 * @param {function} props.onTranscript - Called with final transcript text
 * @param {function} props.onInterimTranscript - Called with interim (partial) transcript
 * @param {string} props.language - Language code for recognition (default: 'en-US')
 * @param {string} props.className - Additional CSS classes
 * @param {string} props.size - Button size: 'small', 'medium', 'large' (default: 'medium')
 * @param {boolean} props.showWaveform - Show audio level waveform animation
 * @param {boolean} props.showTimer - Show recording duration timer
 * @param {boolean} props.disabled - Disable the button
 */
function VoiceInput({
    onTranscript = () => { },
    onInterimTranscript = () => { },
    language = 'en-US',
    className = '',
    size = 'medium',
    showWaveform = true,
    showTimer = true,
    disabled = false,
}) {
    const [recordingDuration, setRecordingDuration] = useState(0);
    const [showPermissionHelp, setShowPermissionHelp] = useState(false);

    const handleResult = useCallback((result) => {
        if (result.type === 'final') {
            onTranscript(result.text);
        } else if (result.type === 'interim') {
            onInterimTranscript(result.text);
        }
    }, [onTranscript, onInterimTranscript]);

    const handleError = useCallback((error) => {
        if (error.code === 'not-allowed') {
            setShowPermissionHelp(true);
        }
    }, []);

    const {
        isListening,
        isSupported,
        permissionStatus,
        audioLevel,
        error,
        startListening,
        stopListening,
    } = useVoiceRecognition({
        language,
        continuous: true,
        interimResults: true,
        onResult: handleResult,
        onError: handleError,
    });

    // Recording duration timer
    useEffect(() => {
        let interval;
        if (isListening) {
            setRecordingDuration(0);
            interval = setInterval(() => {
                setRecordingDuration(prev => prev + 1);
            }, 1000);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isListening]);

    // Format duration as mm:ss
    const formatDuration = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleClick = () => {
        if (disabled) return;

        if (isListening) {
            stopListening();
        } else {
            setShowPermissionHelp(false);
            startListening();
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleClick();
        }
    };

    // Generate waveform bars based on audio level
    const getWaveformBars = () => {
        const numBars = 5;
        const bars = [];
        for (let i = 0; i < numBars; i++) {
            const baseHeight = 20;
            const variation = Math.sin(Date.now() / 200 + i) * 0.3 + 0.7;
            const height = isListening
                ? baseHeight + (audioLevel * 80 * variation)
                : baseHeight;
            bars.push(height);
        }
        return bars;
    };

    if (!isSupported) {
        return (
            <div className={`voice-input-unsupported ${className}`}>
                <button
                    className={`voice-btn ${size} unsupported`}
                    disabled
                    title="Speech recognition is not supported in this browser"
                    aria-label="Speech recognition not supported"
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                        <line x1="12" y1="19" x2="12" y2="23" />
                        <line x1="8" y1="23" x2="16" y2="23" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                </button>
            </div>
        );
    }

    return (
        <div className={`voice-input-container ${className}`}>
            {/* Main Mic/Stop Button */}
            <button
                className={`voice-btn ${size} ${isListening ? 'recording' : ''} ${disabled ? 'disabled' : ''}`}
                onClick={handleClick}
                onKeyDown={handleKeyDown}
                disabled={disabled}
                aria-label={isListening ? 'Stop voice input' : 'Start voice input'}
                aria-pressed={isListening}
                title={isListening ? 'Stop recording' : 'Start speaking'}
            >
                {isListening ? (
                    // Stop Icon
                    <svg className="stop-icon" viewBox="0 0 24 24" fill="currentColor">
                        <rect x="6" y="6" width="12" height="12" rx="2" />
                    </svg>
                ) : (
                    // Mic Icon
                    <svg className="mic-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                        <line x1="12" y1="19" x2="12" y2="23" />
                        <line x1="8" y1="23" x2="16" y2="23" />
                    </svg>
                )}

                {/* Recording pulse animation */}
                {isListening && (
                    <>
                        <span className="pulse-ring pulse-1" />
                        <span className="pulse-ring pulse-2" />
                    </>
                )}
            </button>

            {/* Recording Indicator */}
            {isListening && (
                <div className="recording-indicator">
                    {/* Waveform Animation */}
                    {showWaveform && (
                        <div className="waveform">
                            {getWaveformBars().map((height, i) => (
                                <span
                                    key={i}
                                    className="wave-bar"
                                    style={{ height: `${height}%` }}
                                />
                            ))}
                        </div>
                    )}

                    {/* Timer */}
                    {showTimer && (
                        <span className="recording-timer">
                            <span className="recording-dot" />
                            {formatDuration(recordingDuration)}
                        </span>
                    )}
                </div>
            )}

            {/* Permission Status Badge */}
            {permissionStatus === 'denied' && (
                <span className="permission-badge denied" title="Microphone permission denied">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="15" y1="9" x2="9" y2="15" />
                        <line x1="9" y1="9" x2="15" y2="15" />
                    </svg>
                </span>
            )}

            {/* Error/Permission Help Message */}
            {(error || showPermissionHelp) && (
                <div className="voice-error-tooltip">
                    <div className="error-content">
                        {permissionStatus === 'denied' ? (
                            <>
                                <strong>Microphone Access Denied</strong>
                                <p>Please enable microphone access in your browser settings:</p>
                                <ol>
                                    <li>Click the lock/info icon in the address bar</li>
                                    <li>Find "Microphone" in permissions</li>
                                    <li>Select "Allow"</li>
                                    <li>Refresh the page</li>
                                </ol>
                            </>
                        ) : error ? (
                            <>
                                <strong>Voice Input Error</strong>
                                <p>{error.message}</p>
                                {error.retryable && (
                                    <button
                                        className="retry-btn"
                                        onClick={() => {
                                            setShowPermissionHelp(false);
                                            startListening();
                                        }}
                                    >
                                        Try Again
                                    </button>
                                )}
                            </>
                        ) : null}
                    </div>
                    <button
                        className="close-tooltip-btn"
                        onClick={() => setShowPermissionHelp(false)}
                        aria-label="Close error message"
                    >
                        ×
                    </button>
                </div>
            )}
        </div>
    );
}

export default VoiceInput;
