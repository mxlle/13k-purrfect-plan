export type defineEnum<T> = T[keyof T];

export const defineEnum: <const T extends Record<string, string|number>>(o: T) => Readonly<T> =
  import.meta.env?.MODE === 'development' ? Object.freeze : (o)=> o
