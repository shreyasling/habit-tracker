import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * Custom hook for detecting swipe gestures
 * @param {Object} options - Configuration options
 * @param {function} options.onSwipeLeft - Callback when swiping left
 * @param {function} options.onSwipeRight - Callback when swiping right
 * @param {number} options.threshold - Minimum distance to trigger swipe (default: 50px)
 * @param {number} options.allowedTime - Maximum time for swipe gesture (default: 300ms)
 * @returns {Object} - Handlers and state to attach to swipeable element
 */
const useSwipeGesture = (options = {}) => {
    const {
        onSwipeLeft = () => { },
        onSwipeRight = () => { },
        onSwipeUp = () => { },
        onSwipeDown = () => { },
        threshold = 50,
        allowedTime = 500,
        preventScrollOnSwipe = false,
    } = options;

    const [isSwiping, setIsSwiping] = useState(false);
    const [swipeDirection, setSwipeDirection] = useState(null);
    const [swipeDistance, setSwipeDistance] = useState(0);

    const touchStartRef = useRef({ x: 0, y: 0, time: 0 });
    const touchMoveRef = useRef({ x: 0, y: 0 });

    const handleTouchStart = useCallback((e) => {
        const touch = e.touches[0];
        touchStartRef.current = {
            x: touch.clientX,
            y: touch.clientY,
            time: Date.now(),
        };
        setIsSwiping(true);
        setSwipeDirection(null);
        setSwipeDistance(0);
    }, []);

    const handleTouchMove = useCallback((e) => {
        if (!isSwiping) return;

        const touch = e.touches[0];
        touchMoveRef.current = {
            x: touch.clientX,
            y: touch.clientY,
        };

        const deltaX = touch.clientX - touchStartRef.current.x;
        const deltaY = touch.clientY - touchStartRef.current.y;

        // Determine swipe direction based on which axis has more movement
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            // Horizontal swipe
            setSwipeDirection(deltaX > 0 ? 'right' : 'left');
            setSwipeDistance(Math.abs(deltaX));

            // Prevent vertical scroll when doing horizontal swipe
            if (preventScrollOnSwipe && Math.abs(deltaX) > 10) {
                e.preventDefault();
            }
        } else {
            // Vertical swipe
            setSwipeDirection(deltaY > 0 ? 'down' : 'up');
            setSwipeDistance(Math.abs(deltaY));
        }
    }, [isSwiping, preventScrollOnSwipe]);

    const handleTouchEnd = useCallback((e) => {
        if (!isSwiping) return;

        const endTime = Date.now();
        const elapsedTime = endTime - touchStartRef.current.time;

        const deltaX = touchMoveRef.current.x - touchStartRef.current.x;
        const deltaY = touchMoveRef.current.y - touchStartRef.current.y;

        setIsSwiping(false);

        // Check if it's a valid swipe (within time and distance threshold)
        if (elapsedTime <= allowedTime) {
            const absX = Math.abs(deltaX);
            const absY = Math.abs(deltaY);

            // Horizontal swipe takes precedence for navigation
            if (absX > absY && absX >= threshold) {
                if (deltaX > 0) {
                    onSwipeRight();
                } else {
                    onSwipeLeft();
                }
            }
            // Vertical swipe
            else if (absY > absX && absY >= threshold) {
                if (deltaY > 0) {
                    onSwipeDown();
                } else {
                    onSwipeUp();
                }
            }
        }

        // Reset state
        setSwipeDirection(null);
        setSwipeDistance(0);
    }, [isSwiping, threshold, allowedTime, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown]);

    // Cleanup
    useEffect(() => {
        return () => {
            setIsSwiping(false);
            setSwipeDirection(null);
            setSwipeDistance(0);
        };
    }, []);

    // Return handlers and state
    return {
        handlers: {
            onTouchStart: handleTouchStart,
            onTouchMove: handleTouchMove,
            onTouchEnd: handleTouchEnd,
        },
        isSwiping,
        swipeDirection,
        swipeDistance,
    };
};

export default useSwipeGesture;
