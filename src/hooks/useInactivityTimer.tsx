import { useEffect, useRef, useCallback, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const INACTIVITY_TIMEOUT = 10 * 60 * 1000; // 10 minutes in milliseconds

export const useInactivityTimer = () => {
  const { signOut, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [remainingTime, setRemainingTime] = useState(INACTIVITY_TIMEOUT);
  const lastActivityRef = useRef<number>(Date.now());
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const resetTimer = useCallback(() => {
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Reset last activity time
    lastActivityRef.current = Date.now();
    setRemainingTime(INACTIVITY_TIMEOUT);

    // Only set timeout if on admin pages
    if (location.pathname.startsWith('/admin')) {
      // Set new timeout
      timeoutRef.current = setTimeout(() => {
        signOut();
        navigate('/auth');
      }, INACTIVITY_TIMEOUT);
    }
  }, [signOut, navigate, location.pathname]);

  // Update countdown every second
  useEffect(() => {
    if (!location.pathname.startsWith('/admin')) {
      return;
    }

    countdownIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - lastActivityRef.current;
      const remaining = Math.max(0, INACTIVITY_TIMEOUT - elapsed);
      setRemainingTime(remaining);
    }, 1000);

    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, [location.pathname]);

  useEffect(() => {
    // Only run on admin pages
    if (!location.pathname.startsWith('/admin') || !isAdmin) {
      return;
    }

    // Events that indicate user activity
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'mousemove'];

    // Initialize timer
    resetTimer();

    // Add event listeners
    events.forEach(event => {
      window.addEventListener(event, resetTimer);
    });

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
      events.forEach(event => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, [resetTimer, location.pathname, isAdmin]);

  return { remainingTime };
};
