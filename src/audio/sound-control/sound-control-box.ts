import { CPlayer } from "../small-player";
import { meow } from "../songs/meow";
import { generateUntilDone } from "../music-control";
import { Tool, TurnMove } from "../../types";

let meowSrcUrl: string | undefined;

export async function initSoundEffects() {
  const player = new CPlayer();
  player.init(meow);

  await generateUntilDone(player);
  const wave = player.createWave();
  meowSrcUrl = URL.createObjectURL(new Blob([wave], { type: "audio/wav" }));
}

export function getSoundBoxSrc(turnMove: TurnMove) {
  return turnMove === Tool.MEOW ? meowSrcUrl : undefined;
}
