export const IS_POKI_ENABLED = import.meta.env.POKI_ENABLED === "true";
export const IS_DEV = import.meta.env.DEV;
export const HAS_VISUAL_NICE_TO_HAVES = import.meta.env.VISUAL_NICE_TO_HAVES === "true";
export const HAS_GAMEPLAY_NICE_TO_HAVES = import.meta.env.GAMEPLAY_NICE_TO_HAVES === "true";
export const HAS_ADVANCED_DEBUGGING = HAS_GAMEPLAY_NICE_TO_HAVES; // note for now the same
export const HAS_MUTE_BUTTON = import.meta.env.HAS_MUTE_BUTTON === "true";
export const HAS_SIMPLE_SOUND_EFFECTS = true;
export const HAS_SPOKEN_MEOW = false;
export const HAS_RECORDED_SOUND_EFFECTS = true;
export const HAS_MEOW = HAS_SPOKEN_MEOW || HAS_RECORDED_SOUND_EFFECTS;
export const HAS_KITTEN_MEOWS = false;
export const GAME_TITLE = "Kittens United";
