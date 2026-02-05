import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * Detect if we're on a mobile device
 */
const isMobileDevice = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

/**
 * Detect if we're on iOS
 */
const isIOSDevice = () => {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
        (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
};

/**
 * Custom hook for handling Web Speech API with mobile PWA support
 * Provides speech-to-text functionality with interim results
 */
const useVoiceRecognition = (options = {}) => {
    const {
        language = 'en-US',
        continuous: continuousOverride,
        interimResults = true,
        onResult = () => { },
        onError = () => { },
        onStart = () => { },
        onEnd = () => { },
    } = options;

    // On mobile, continuous mode often causes issues
    const isMobile = isMobileDevice();
    const isIOS = isIOSDevice();
    const continuous = continuousOverride !== undefined ? continuousOverride : !isMobile;

    // State management
    const [isListening, setIsListening] = useState(false);
    const [isSupported, setIsSupported] = useState(false);
    const [permissionStatus, setPermissionStatus] = useState('prompt');
    const [transcript, setTranscript] = useState('');
    const [interimTranscript, setInterimTranscript] = useState('');
    const [error, setError] = useState(null);
    const [audioLevel, setAudioLevel] = useState(0);
    const [isMobileWarning, setIsMobileWarning] = useState(false);

    // Refs for managing recognition instance
    const recognitionRef = useRef(null);
    const audioContextRef = useRef(null);
    const analyserRef = useRef(null);
    const animationFrameRef = useRef(null);
    const streamRef = useRef(null);
    const restartTimeoutRef = useRef(null);

    // Check browser support on mount
    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const supported = !!SpeechRecognition;
        setIsSupported(supported);

        // Show iOS warning if on iOS and not in native Safari
        if (isIOS) {
            // Check if we're in a PWA on iOS
            const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches ||
                (window.navigator).standalone === true;
            if (isInStandaloneMode) {
                // iOS PWA has limited speech recognition support
                setIsMobileWarning(true);
            }
        }

        // Check microphone permission status if available
        if (navigator.permissions && navigator.permissions.query) {
            navigator.permissions.query({ name: 'microphone' })
                .then(result => {
                    setPermissionStatus(result.state);
                    result.onchange = () => setPermissionStatus(result.state);
                })
                .catch(() => {
                    // Permission API not fully supported (common on iOS)
                    setPermissionStatus('prompt');
                });
        }

        return () => {
            cleanupRecognition();
        };
    }, []);

    // Cleanup function
    const cleanupRecognition = useCallback(() => {
        if (restartTimeoutRef.current) {
            clearTimeout(restartTimeoutRef.current);
            restartTimeoutRef.current = null;
        }
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            try {
                audioContextRef.current.close();
            } catch (e) {
                console.warn('AudioContext close error:', e);
            }
            audioContextRef.current = null;
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (recognitionRef.current) {
            try {
                recognitionRef.current.abort();
            } catch (e) {
                console.warn('Recognition abort error:', e);
            }
            recognitionRef.current = null;
        }
        setAudioLevel(0);
    }, []);

    // Audio level visualization - with mobile-safe implementation
    const startAudioVisualization = useCallback(async (existingStream) => {
        try {
            // Use existing stream if provided, otherwise request new one
            const stream = existingStream || await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                }
            });
            streamRef.current = stream;

            // Create AudioContext (need to resume after user gesture on mobile)
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (!AudioContextClass) {
                console.warn('AudioContext not supported');
                return;
            }

            const audioContext = new AudioContextClass();
            audioContextRef.current = audioContext;

            // Resume audio context if suspended (required on mobile)
            if (audioContext.state === 'suspended') {
                await audioContext.resume();
            }

            const analyser = audioContext.createAnalyser();
            analyserRef.current = analyser;
            analyser.fftSize = 256;
            analyser.smoothingTimeConstant = 0.8;

            const source = audioContext.createMediaStreamSource(stream);
            source.connect(analyser);

            const dataArray = new Uint8Array(analyser.frequencyBinCount);

            const updateLevel = () => {
                if (!analyserRef.current) return;

                analyser.getByteFrequencyData(dataArray);
                const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
                setAudioLevel(Math.min(average / 128, 1));
                animationFrameRef.current = requestAnimationFrame(updateLevel);
            };

            updateLevel();
        } catch (err) {
            console.warn('Audio visualization error:', err);
            // Don't fail the whole operation for visualization error
        }
    }, []);

    // Start listening
    const startListening = useCallback(async () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

        if (!SpeechRecognition) {
            const errorObj = {
                code: 'not-supported',
                message: isMobile
                    ? 'Speech recognition is not supported on this device. Try using Chrome or Safari.'
                    : 'Speech recognition is not supported in this browser.',
                retryable: false
            };
            setError(errorObj);
            onError(errorObj);
            return false;
        }

        // Cleanup any existing recognition
        cleanupRecognition();

        setError(null);
        setTranscript('');
        setInterimTranscript('');

        try {
            // Request microphone permission first with mobile-optimized constraints
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                    // Lower sample rate for better mobile performance
                    sampleRate: isMobile ? 16000 : 48000,
                }
            });

            setPermissionStatus('granted');

            const recognition = new SpeechRecognition();
            recognitionRef.current = recognition;

            // Configure recognition
            recognition.lang = language;
            recognition.interimResults = interimResults;
            recognition.maxAlternatives = 1;

            // Mobile-specific settings
            if (isMobile) {
                // Disable continuous mode on mobile for better reliability
                recognition.continuous = false;
                console.log('[VoiceRecognition] Mobile mode: continuous=false');
            } else {
                recognition.continuous = continuous;
            }

            console.log('[VoiceRecognition] Language:', language, 'interimResults:', interimResults);

            // Safety timeout for mobile - if no results after 15 seconds of "listening", restart
            let mobileTimeout = null;
            const startMobileTimeout = () => {
                if (isMobile) {
                    clearTimeout(mobileTimeout);
                    mobileTimeout = setTimeout(() => {
                        console.log('[VoiceRecognition] Mobile timeout - no results, restarting...');
                        if (recognitionRef.current) {
                            try {
                                recognitionRef.current.stop();
                                setTimeout(() => {
                                    if (recognitionRef.current) {
                                        recognitionRef.current.start();
                                    }
                                }, 300);
                            } catch (e) {
                                console.warn('[VoiceRecognition] Timeout restart failed:', e);
                            }
                        }
                    }, 15000);
                }
            };

            recognition.onstart = () => {
                console.log('[VoiceRecognition] Recognition STARTED on', isMobile ? 'MOBILE' : 'DESKTOP');
                setIsListening(true);
                onStart();
                // Start visualization with the stream we already have
                startAudioVisualization(stream);
                // Start safety timeout on mobile
                startMobileTimeout();
            };

            recognition.onresult = (event) => {
                console.log('[VoiceRecognition] Got result event:', event.results.length, 'results');
                let finalTranscript = '';
                let interimText = '';

                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const result = event.results[i];
                    console.log('[VoiceRecognition] Result', i, ':', result[0].transcript, 'isFinal:', result.isFinal);

                    if (result.isFinal) {
                        finalTranscript += result[0].transcript;
                    } else {
                        interimText += result[0].transcript;
                    }
                }

                if (finalTranscript) {
                    setTranscript(prev => prev + finalTranscript);
                    onResult({
                        type: 'final',
                        text: finalTranscript,
                        confidence: event.results[event.resultIndex]?.[0]?.confidence || 0
                    });
                }

                setInterimTranscript(interimText);
                if (interimText) {
                    onResult({ type: 'interim', text: interimText });
                }
            };

            // Add soundstart/soundend handlers to detect if audio is being captured
            recognition.onsoundstart = () => {
                console.log('[VoiceRecognition] Sound started - mic is picking up audio');
            };

            recognition.onsoundend = () => {
                console.log('[VoiceRecognition] Sound ended');
            };

            recognition.onspeechstart = () => {
                console.log('[VoiceRecognition] Speech started - voice detected');
            };

            recognition.onspeechend = () => {
                console.log('[VoiceRecognition] Speech ended');
            };

            recognition.onaudiostart = () => {
                console.log('[VoiceRecognition] Audio capture started');
            };

            recognition.onaudioend = () => {
                console.log('[VoiceRecognition] Audio capture ended');
            };

            recognition.onerror = (event) => {
                let errorMessage = 'An error occurred during speech recognition.';
                let retryable = true;

                switch (event.error) {
                    case 'no-speech':
                        errorMessage = 'No speech was detected. Please try again.';
                        // Auto-restart on mobile if no speech detected
                        if (isMobile && isListening) {
                            restartTimeoutRef.current = setTimeout(() => {
                                if (recognitionRef.current) {
                                    try {
                                        recognitionRef.current.start();
                                    } catch (e) {
                                        console.warn('Restart failed:', e);
                                    }
                                }
                            }, 100);
                            return;
                        }
                        break;
                    case 'audio-capture':
                        errorMessage = 'Microphone is not available. Please check your microphone settings.';
                        retryable = true;
                        break;
                    case 'not-allowed':
                        errorMessage = isMobile
                            ? 'Microphone access denied. Please enable microphone in your device settings.'
                            : 'Microphone permission was denied.';
                        setPermissionStatus('denied');
                        retryable = false;
                        break;
                    case 'network':
                        errorMessage = 'Network error. Speech recognition requires an internet connection.';
                        break;
                    case 'service-not-allowed':
                        errorMessage = isIOS
                            ? 'Speech recognition is not available in iOS PWA. Try opening in Safari.'
                            : 'Speech recognition service is not available.';
                        retryable = false;
                        break;
                    case 'aborted':
                        // User cancelled - not an error
                        return;
                    default:
                        errorMessage = `Speech recognition error: ${event.error}`;
                }

                const errorObj = { code: event.error, message: errorMessage, retryable };
                setError(errorObj);
                onError(errorObj);
                cleanupRecognition();
                setIsListening(false);
            };

            recognition.onend = () => {
                // On mobile, recognition ends after each utterance
                // Don't cleanup if we're supposed to keep listening
                if (!isMobile || !continuous) {
                    setIsListening(false);
                    cleanupRecognition();
                    onEnd();
                } else if (isListening && recognitionRef.current) {
                    // Auto-restart on mobile for continuous mode
                    restartTimeoutRef.current = setTimeout(() => {
                        if (recognitionRef.current) {
                            try {
                                recognitionRef.current.start();
                            } catch (e) {
                                console.warn('Auto-restart failed:', e);
                                setIsListening(false);
                                cleanupRecognition();
                                onEnd();
                            }
                        }
                    }, 100);
                }
            };

            recognition.start();
            return true;
        } catch (err) {
            let errorMessage = 'Failed to start speech recognition.';

            if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                errorMessage = isMobile
                    ? 'Microphone access was denied. Please enable it in your device settings and try again.'
                    : 'Microphone permission was denied. Please enable it in your browser settings.';
                setPermissionStatus('denied');
            } else if (err.name === 'NotFoundError') {
                errorMessage = 'No microphone found. Please connect a microphone.';
            } else if (err.name === 'NotReadableError') {
                errorMessage = 'Microphone is in use by another application.';
            } else if (err.name === 'OverconstrainedError') {
                // Retry with basic constraints
                try {
                    await navigator.mediaDevices.getUserMedia({ audio: true });
                    return startListening();
                } catch (retryErr) {
                    errorMessage = 'Could not access microphone with current settings.';
                }
            }

            const errorObj = {
                code: err.name,
                message: errorMessage,
                retryable: err.name !== 'NotAllowedError' && err.name !== 'PermissionDeniedError'
            };
            setError(errorObj);
            onError(errorObj);
            return false;
        }
    }, [language, continuous, interimResults, isMobile, isIOS, isListening, onResult, onError, onStart, onEnd, startAudioVisualization, cleanupRecognition]);

    // Stop listening
    const stopListening = useCallback(() => {
        if (restartTimeoutRef.current) {
            clearTimeout(restartTimeoutRef.current);
            restartTimeoutRef.current = null;
        }
        if (recognitionRef.current) {
            try {
                recognitionRef.current.stop();
            } catch (e) {
                console.warn('Stop error:', e);
            }
        }
        cleanupRecognition();
        setIsListening(false);
    }, [cleanupRecognition]);

    // Toggle listening
    const toggleListening = useCallback(() => {
        if (isListening) {
            stopListening();
        } else {
            startListening();
        }
    }, [isListening, startListening, stopListening]);

    // Get the full transcript (final + interim)
    const getFullTranscript = useCallback(() => {
        return transcript + (interimTranscript ? ' ' + interimTranscript : '');
    }, [transcript, interimTranscript]);

    // Clear transcript
    const clearTranscript = useCallback(() => {
        setTranscript('');
        setInterimTranscript('');
    }, []);

    return {
        isListening,
        isSupported,
        permissionStatus,
        transcript,
        interimTranscript,
        fullTranscript: getFullTranscript(),
        error,
        audioLevel,
        isMobile,
        isIOS,
        isMobileWarning,
        startListening,
        stopListening,
        toggleListening,
        clearTranscript,
    };
};

export default useVoiceRecognition;
