export function removeDuplicates<T>(arr: T[]): T[] {
  return arr.filter((item, index) => arr.indexOf(item) === index);
}

export function getRandomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function areArraysEqual<T>(arr1: T[], arr2: T[]) {
  return arr1.length === arr2.length && arr1.every((item, index) => item === arr2[index]);
}

export function areArraysEqualIgnoreOrder<T>(arr1: T[], arr2: T[]) {
  return arr1.length === arr2.length && arr1.sort().every((item, index) => item === arr2.sort()[index]);
}

export function getArrayIntersection(arr1: any[], arr2: any[]): ((typeof arr1)[number] & (typeof arr2)[number])[] {
  return arr1.filter((item) => arr2.includes(item));
}

export function pushPrimitiveIfNotInList<T>(value: T, list: T[]) {
  if (!list.includes(value)) {
    list.push(value);
  }
}
