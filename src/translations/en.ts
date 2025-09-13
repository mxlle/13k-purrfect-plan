import { TranslationKey } from "./translationKey";
import { HAS_RECORDED_SOUND_EFFECTS, HAS_SHORT_TEXTS } from "../env-utils";

export const enTranslations: Record<TranslationKey, string> = {
  [TranslationKey.START_GAME]: HAS_SHORT_TEXTS ? "Start" : "Start game",
  [TranslationKey.NEW_GAME]: "New game",
  [TranslationKey.RESTART_GAME]: "Try again",
  [TranslationKey.RETRIES]: "Retries",
  [TranslationKey.CONTINUE]: "Continue",
  [TranslationKey.DIFFICULTY]: "Difficulty",
  [TranslationKey.MOVES]: "Moves",
  [TranslationKey.CHOOSER_TITLE]: "What would you like to add next?",
  [TranslationKey.CHOICE_TOOL]: "New action",
  [TranslationKey.CHOICE_RULE]: "New rule",
  [TranslationKey.CHOICE_KITTEN_BEHAVIOR]: "Kitten personality",
  [TranslationKey.EXPLANATION_MOONY]: HAS_SHORT_TEXTS ? "Will run to the moon" : "Moony loves the moon and will try to reach it.",
  [TranslationKey.EXPLANATION_IVY]: HAS_SHORT_TEXTS ? "Will run around the tree" : "Ivy loves to run around the tree.",
  [TranslationKey.EXPLANATION_SPLASHY]: HAS_SHORT_TEXTS
    ? "Will run to the water"
    : "Splashy loves water and wants to play in it. Once she's in, you can only lure her out with Mom's meow.",
  [TranslationKey.EXPLANATION_MEOW]: HAS_SHORT_TEXTS
    ? "Lures the kittens closer"
    : "When Mom meows, all kittens move one step closer. But you can only do this every 3 moves.",
  [TranslationKey.EXPLANATION_WAIT]: HAS_SHORT_TEXTS ? "Do nothing" : "You can stay where you are and wait for the kittens to move.",
  [TranslationKey.EXPLANATION_MOVE_LIMIT_1]: HAS_SHORT_TEXTS
    ? "Once the moon sets, darkness falls"
    : "The moon moves across the sky. Once it sets, darkness falls - but you can still finish.",
  [TranslationKey.EXPLANATION_MOVE_LIMIT_2]: "Unite all kittens before the moon sets!",
  [TranslationKey.EXPLANATION_EMPTY]: HAS_SHORT_TEXTS ? "..." : "Your choice will be explained here.",
  [TranslationKey.YOUR_CHOICE]: "Your choice",
  [TranslationKey.UNITED]: "United!",
  [TranslationKey.LOST]: "Oh no!",
  [TranslationKey.MEOW]: "Meow",
  [TranslationKey.WAIT]: "Wait",
  [TranslationKey.LOADING]: "Loading...",
  [TranslationKey.HINT]: "Hint",
  [TranslationKey.COLLECT_XP]: HAS_SHORT_TEXTS ? "" : "Collect +{0}",
  [TranslationKey.SKIP_TUTORIAL]: HAS_SHORT_TEXTS ? "Skip tutorial" : "Give me everything! I'll figure it out.",
  [TranslationKey.RECORD]: HAS_RECORDED_SOUND_EFFECTS ? "Record meow" : " ",
  [TranslationKey.DELETE_RECORD]: HAS_RECORDED_SOUND_EFFECTS ? "Delete meow" : " ",
  [TranslationKey.SHARE_LOAD_GAME]: HAS_SHORT_TEXTS ? "Share/load game" : "Share or load a game via the emoji string",
};
