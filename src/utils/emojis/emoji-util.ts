import type { Tagged } from "type-fest";

export type Emoji = Tagged<string, "Emoji">;

export function splitEmojis(string: string): Emoji[] {
  const list: Emoji[] = [];
  while (string.length) {
    const [char] =
      string.match(
        /^[\u{1F1E6}-\u{1F1FF}]{2}|.[\ufe0e\ufe0f]?[\u{1F3FB}-\u{1F3FF}]?(\u200d\p{Emoji}[\ufe0e\ufe0f]?|[\u{E0020}-\u{E007F}])*[\ufe0e\ufe0f]?/u
      ) ?? [];
    if (!string) break;
    if (isCharacterEmoji(char)) {
      list.push(char);
    }
    string = string.slice(char?.length);
  }
  return list;
}

export function isCharacterEmoji(char: unknown): char is Emoji {
  if (typeof char !== "string") return false;
  return /\p{Emoji}/u.test(char);
}

export function isMovingEmoji(emoji: Emoji): boolean {
  const regexExp =
    /([\u{1F3CE}\u{02603}\u{026c4}\u{026f4}-\u{026f9}\u{02708}\u{1f385}\u{1f3c2}-\u{1f3c4}\u{1f3c7}\u{1f400}-\u{1f43d}\u{1f43f}\u{1f466}-\u{1f47f}\u{1f481}-\u{1f483}\u{1f486}-\u{1f487}\u{1f574}-\u{1f575}\u{1f577}\u{1f57a}\u{1f600}-\u{1f64c}\u{1f64d}-\u{1f64e}\u{1f680}-\u{1f68e}\u{1f690}-\u{1f6a4}\u{1f6b2}\u{1f6b4}-\u{1f6b5}\u{1f6e5}\u{1f6e9}\u{1f691}-\u{1f697}\u{1f920}-\u{1f931}\u{1f934}-\u{1f93e}\u{1f970}-\u{1f97a}\u{1f980}-\u{1f9ae}\u{1f9cd}\u{1f9cf}-\u{1f9df}\u{1fab0}-\u{1fab3}])/giu;

  return regexExp.test(emoji);
}
