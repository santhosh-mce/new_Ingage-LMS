import confetti from 'canvas-confetti';

/**
 * Triggers a vibrant, multi-stage confetti celebration
 * across the screen when a lesson or course is completed.
 */
export function triggerLessonCompletionCelebration(isCourseComplete = false) {
  if (typeof window === 'undefined') return;

  const colors = [
    '#10B981', // Emerald green
    '#3B82F6', // Royal blue
    '#F59E0B', // Amber gold
    '#EC4899', // Vivid pink
    '#8B5CF6', // Purple
    '#06B6D4', // Cyan
    '#EF4444', // Coral red
  ];

  try {
    // 1. Initial celebratory center blast
    confetti({
      particleCount: isCourseComplete ? 120 : 80,
      spread: 70,
      origin: { x: 0.5, y: 0.55 },
      colors,
      gravity: 1.1,
      scalar: 1.1,
      zIndex: 999999,
    });

    // 2. Realistic falling side cannons (left and right)
    const duration = isCourseComplete ? 3000 : 2200;
    const animationEnd = Date.now() + duration;

    const interval: any = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 40 * (timeLeft / duration);

      // Left cannon shooting up-right (60 degrees)
      confetti({
        particleCount: Math.floor(particleCount * 0.7),
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
        colors,
        gravity: 1.0,
        startVelocity: 45,
        zIndex: 999999,
      });

      // Right cannon shooting up-left (120 degrees)
      confetti({
        particleCount: Math.floor(particleCount * 0.7),
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
        colors,
        gravity: 1.0,
        startVelocity: 45,
        zIndex: 999999,
      });
    }, 250);
  } catch (error) {
    console.warn('Confetti animation error:', error);
  }
}
