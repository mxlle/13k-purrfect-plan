export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function waitForPromiseAndTime(promise: Promise<unknown>, ms: number) {
  return Promise.all([promise, sleep(ms)]);
}

export async function requestAnimationFrameWithTimeout(ms: number): Promise<void> {
  if (ms < 0) {
    return;
  }

  await sleep(ms);
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}
