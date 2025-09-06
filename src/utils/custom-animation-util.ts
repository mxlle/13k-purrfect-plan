/**
 * Easing function type
 * See https://easings.net/ for examples.
 * Important: x must be in the range [0, 1]
 */
type EasingFunction = (x: number) => number;

/**
 * Linear easing
 */
export const easeLinear: EasingFunction = (x: number) => x;

/**
 * Ease in out quadratic easing
 */
export const easeInOutQuad: EasingFunction = (x: number) => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2);

/**
 * Ease out quadratic easing
 */
export const easeOutQuad: EasingFunction = (x: number) => x * (2 - x);

type CalcTweenStateFn<T> = (from: T, to: T, progress: number) => T;

const calcNumberTween: CalcTweenStateFn<number> = (from: number, to: number, progress: number) => from + progress * (to - from);

interface AnimateOptions<T> {
  /** Duration of each keyframe */
  keyframeDuration: number;
  /** Initial state, as default calling nextState */
  initialState: T;
  /** Exit state, as default not calling onProgress again */
  exitState: T;
  /** Callback for each progress */
  onProgress: (state: T) => void;
  /** Function to calculate the tween state */
  calcTweenState: CalcTweenStateFn<T>;
}

function startAnimation<T>({ keyframeDuration = 300, onProgress, calcTweenState, initialState, exitState }: AnimateOptions<T>): void {
  function startKeyframe(): void {
    const startTime = Number(document.timeline.currentTime ?? Date.now());
    (function drawFrame(time: number): void {
      const progress = (time - startTime) / keyframeDuration;
      const progressClamped = Math.min(1, progress);
      const easedProgress = easeInOutQuad(progressClamped);
      onProgress(calcTweenState(initialState, exitState, easedProgress));

      if (progress < 1) {
        requestAnimationFrame(drawFrame);
      } else {
        if (exitState) {
          onProgress(exitState);
        }
      }
    })(startTime);
  }

  startKeyframe();
}

/**
 * Animate a number
 */
export const animateNumber = <T extends number>(options: Omit<AnimateOptions<T>, "calcTweenState">): void =>
  startAnimation({ calcTweenState: calcNumberTween, ...options } as AnimateOptions<T>);
