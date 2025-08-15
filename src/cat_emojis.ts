export const ONBOARDING_CAT_EMOJIS = ["🐈‍⬛"] as const;

export const OTHER_EMOJIS = ["🐈"] as const;

export type Indices<T extends readonly any[]> = Exclude<Partial<T>["length"], T["length"]>;

export type OnboardingEmojiIndex = Indices<typeof ONBOARDING_CAT_EMOJIS>;
