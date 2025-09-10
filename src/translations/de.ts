import { TranslationKey } from "./translationKey";

export function getDeTranslationMap(): Record<TranslationKey, string> {
  if (import.meta.env.GERMAN_ENABLED === "true") {
    return deTranslations;
  }

  throw new Error("German language is not enabled.");
}

const deTranslations: Record<TranslationKey, string> = {
  [TranslationKey.START_GAME]: "Spiel starten",
  [TranslationKey.NEW_GAME]: "Neues Spiel",
  [TranslationKey.RESTART_GAME]: "Nochmal versuchen",
  [TranslationKey.RETRIES]: "Neustarts",
  [TranslationKey.CONTINUE]: "Weiter",
  [TranslationKey.BACK]: "Zurück",
  [TranslationKey.DIFFICULTY]: "Schwierigkeit",
  [TranslationKey.MOVES]: "Züge",
  [TranslationKey.CHOOSER_TITLE]: "Was möchtest du als nächstes hinzufügen?",
  [TranslationKey.CHOICE_TOOL]: "Neue Aktion",
  [TranslationKey.CHOICE_RULE]: "Neue Regel",
  [TranslationKey.CHOICE_KITTEN_BEHAVIOR]: "Kätzchen­charakter",
  [TranslationKey.EXPLANATION_MOONY]: "Moony liebt den Mond und wird versuchen, ihn zu erreichen.",
  [TranslationKey.EXPLANATION_IVY]: "Ivy liebt es, um den Baum herumzulaufen.",
  [TranslationKey.EXPLANATION_SPLASHY]:
    "Splashy liebt Wasser und möchte darin spielen. Ist sie erst einmal drin, kannst du sie nur mit Mamas Miauen herauslocken.",
  [TranslationKey.EXPLANATION_MEOW]: "Wenn Mama miaut, kommen alle Kätzchen einen Schritt näher. Aber das geht nur alle 3 Züge.",
  [TranslationKey.EXPLANATION_MOVE_LIMIT_1]:
    "Der Mond wird über das Feld wandern. Sobald er untergeht, wird das Feld dunkel, aber du kannst trotzdem weiterspielen.",
  [TranslationKey.EXPLANATION_MOVE_LIMIT_2]: "Du musst alle Kätzchen vereinen, bevor der Mond untergeht!",
  [TranslationKey.EXPLANATION_EMPTY]: "Deine Wahl wird hier erklärt.",
  [TranslationKey.YOUR_CHOICE]: "Deine Wahl",
  [TranslationKey.CONFIRM]: "Bestätigen",
  [TranslationKey.UNITED]: "Vereint!",
  [TranslationKey.LOST]: "Oh nein!",
  [TranslationKey.MEOW]: "Miau",
  [TranslationKey.LOADING]: "Laden...",
  [TranslationKey.HINT]: "Hinweis",
  [TranslationKey.COLLECT_XP]: "+{0} einsammeln",
  [TranslationKey.SKIP_TUTORIAL]: "Her mit allem! Ich krieg das schon hin.",
};
