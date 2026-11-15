import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';
import { useSettings } from './SettingsContext';

/**
 * Indica si se pueden usar animaciones no esenciales.
 * Combina la preferencia de la app con la opción del sistema
 * "Reducir movimiento" / "Quitar animaciones" (WCAG 2.3.3).
 */
export function useMotion(): boolean {
  const { settings } = useSettings();
  const [systemReduce, setSystemReduce] = useState(false);

  useEffect(() => {
    let active = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((v) => active && setSystemReduce(v))
      .catch(() => undefined);
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setSystemReduce);
    return () => {
      active = false;
      sub.remove();
    };
  }, []);

  return settings.animationsEnabled && !systemReduce;
}
