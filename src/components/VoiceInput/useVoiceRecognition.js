import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * Custom hook for handling Web Speech API with fallbacks
 * Provides speech-to-text functionality with interim results
 */
const useVoiceRecognition = (options = {}) => {
    const {
        language = 'en-US',
        continuous = true,
        interimResults = true,
        onResult = () => { },
        onError = () => { },
        onStart = () => { },
        onEnd = () => { },
    } = options;

    // State management
    const [isListening, setIsListening] = useState(false);
    const [isSupported, setIsSupported] = useState(false);
    const [permissionStatus, setPermissionStatus] = useState('prompt'); // 'prompt', 'granted', 'denied'
    const [transcript, setTranscript] = useState('');
    const [interimTranscript, setInterimTranscript] = useState('');
    const [error, setError] = useState(null);
    const [audioLevel, setAudioLevel] = useState(0);

    // Refs for managing recognition instance
    const recognitionRef = useRef(null);
    const audioContextRef = useRef(null);
    const analyserRef = useRef(null);
    const animationFrameRef = useRef(null);
    const streamRef = useRef(null);

    // Check browser support on mount
    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        setIsSupported(!!SpeechRecognition);

        // Check microphone permission status if available
        if (navigator.permissions) {
            navigator.permissions.query({ name: 'microphone' })
                .then(result => {
                    setPermissionStatus(result.state);
                    result.onchange = () => setPermissionStatus(result.state);
                })
                .catch(() => {
                    // Permission API not fully supported
                    setPermissionStatus('prompt');
                });
        }

        return () => {
            cleanupRecognition();
        };
    }, []);

    // Cleanup function
    const cleanupRecognition = useCallback(() => {
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
        }
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close();
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
        }
        if (recognitionRef.current) {
            recognitionRef.current.abort();
            recognitionRef.current = null;
        }
        setAudioLevel(0);
    }, []);

    // Audio level visualization
    const startAudioVisualization = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;

            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            audioContextRef.current = audioContext;

            const analyser = audioContext.createAnalyser();
            analyserRef.current = analyser;
            analyser.fftSize = 256;

            const source = audioContext.createMediaStreamSource(stream);
            source.connect(analyser);

            const dataArray = new Uint8Array(analyser.frequencyBinCount);

            const updateLevel = () => {
                analyser.getByteFrequencyData(dataArray);
                const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
                setAudioLevel(Math.min(average / 128, 1)); // Normalize to 0-1
                animationFrameRef.current = requestAnimationFrame(updateLevel);
            };

            updateLevel();
        } catch (err) {
            console.error('Audio visualization error:', err);
        }
    }, []);

    // Start listening
    const startListening = useCallback(async () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

        if (!SpeechRecognition) {
            setError({ code: 'not-supported', message: 'Speech recognition is not supported in this browser.' });
            onError({ code: 'not-supported', message: 'Speech recognition is not supported in this browser.' });
            return false;
        }

        setError(null);
        setTranscript('');
        setInterimTranscript('');

        try {
            // Request microphone permission first
            await navigator.mediaDevices.getUserMedia({ audio: true });
            setPermissionStatus('granted');

            const recognition = new SpeechRecognition();
            recognitionRef.current = recognition;

            recognition.lang = language;
            recognition.continuous = continuous;
            recognition.interimResults = interimResults;
            recognition.maxAlternatives = 1;

            recognition.onstart = () => {
                setIsListening(true);
                onStart();
                startAudioVisualization();
            };

            recognition.onresult = (event) => {
                let finalTranscript = '';
                let interimText = '';

                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const result = event.results[i];
                    if (result.isFinal) {
                        finalTranscript += result[0].transcript;
                    } else {
                        interimText += result[0].transcript;
                    }
                }

                if (finalTranscript) {
                    setTranscript(prev => prev + finalTranscript);
                    onResult({ type: 'final', text: finalTranscript, confidence: event.results[0]?.[0]?.confidence || 0 });
                }

                setInterimTranscript(interimText);
                if (interimText) {
                    onResult({ type: 'interim', text: interimText });
                }
            };

            recognition.onerror = (event) => {
                let errorMessage = 'An error occurred during speech recognition.';
                let retryable = true;

                switch (event.error) {
                    case 'no-speech':
                        errorMessage = 'No speech was detected. Please try again.';
                        break;
                    case 'audio-capture':
                        errorMessage = 'Microphone is not available or in use by another app.';
                        retryable = true;
                        break;
                    case 'not-allowed':
                        errorMessage = 'Microphone permission was denied.';
                        setPermissionStatus('denied');
                        retryable = false;
                        break;
                    case 'network':
                        errorMessage = 'Network error occurred. Please check your connection.';
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
                setIsListening(false);
                cleanupRecognition();
                onEnd();
            };

            recognition.start();
            return true;
        } catch (err) {
            let errorMessage = 'Failed to start speech recognition.';

            if (err.name === 'NotAllowedError') {
                errorMessage = 'Microphone permission was denied. Please enable it in your browser settings.';
                setPermissionStatus('denied');
            } else if (err.name === 'NotFoundError') {
                errorMessage = 'No microphone found. Please connect a microphone.';
            }

            const errorObj = { code: err.name, message: errorMessage, retryable: err.name !== 'NotAllowedError' };
            setError(errorObj);
            onError(errorObj);
            return false;
        }
    }, [language, continuous, interimResults, onResult, onError, onStart, onEnd, startAudioVisualization, cleanupRecognition]);

    // Stop listening
    const stopListening = useCallback(() => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
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
        startListening,
        stopListening,
        toggleListening,
        clearTranscript,
    };
};

export default useVoiceRecognition;
