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
  /** Function to get the next state, knowing the previous state */
  nextState: (prev?: T) => T;
  /** Initial state, as default calling nextState */
  initialState?: T;
  /** Exit state, as default not calling onProgress again */
  exitState?: T;
  /** Easing function, linear by default */
  easing?: EasingFunction;
  /** Callback for each progress */
  onProgress: (state: T) => void;
  /** Function to calculate the tween state */
  calcTweenState: CalcTweenStateFn<T>;
  /** Number of iterations, infinite by default */
  iterationCount?: number;
}

export interface AnimationInterval {
  cancel: () => void;
}

function createAnimationInterval<T>({
  keyframeDuration = 300,
  nextState,
  easing = easeLinear,
  onProgress,
  calcTweenState,
  initialState = nextState(),
  exitState,
  iterationCount = Infinity,
}: AnimateOptions<T>): AnimationInterval {
  let fromState: T,
    toState: T = initialState,
    counter: number = 0,
    animationFrameHandler: number;

  function cancel(): void {
    clearInterval(intervalHandler);
    cancelAnimationFrame(animationFrameHandler); // here we could consider in the future to keep the last keyframe running

    // update the state one more time to the exit state
    onProgress(exitState ?? toState);
  }

  function startKeyframe(): void {
    if (counter >= iterationCount) {
      cancel();

      return;
    }

    counter++;
    fromState = toState;
    toState = nextState(fromState);
    const startTime = Number(document.timeline.currentTime ?? Date.now());
    (function drawFrame(time: number): void {
      const progress = (time - startTime) / keyframeDuration;
      const progressClamped = Math.min(1, progress);
      const easedProgress = easing(progressClamped);
      onProgress(calcTweenState(fromState, toState, easedProgress));

      if (progress < 1) {
        animationFrameHandler = requestAnimationFrame(drawFrame);
      }
    })(startTime);
  }

  const intervalHandler = setInterval(startKeyframe, keyframeDuration);
  startKeyframe();

  return { cancel };
}

/**
 * Animate a number
 */
export const animateNumber = <T extends number>(options: Omit<AnimateOptions<T>, "calcTweenState">): AnimationInterval =>
  createAnimationInterval({ calcTweenState: calcNumberTween, ...options } as AnimateOptions<T>);
