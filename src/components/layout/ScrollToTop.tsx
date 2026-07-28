import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

export function ScrollToTop() {
  const location = useLocation();
  const previousPathnameRef = useRef(location.pathname);

  useEffect(() => {
    if (previousPathnameRef.current !== location.pathname) {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'instant' as ScrollBehavior,
      });
    }

    previousPathnameRef.current = location.pathname;
  }, [location.pathname]);

  return null;
}
