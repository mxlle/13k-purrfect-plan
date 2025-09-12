import { CPlayer } from "../small-player";
import { meow } from "../songs/meow";
import { loseSound, winSound } from "../songs/music-and-sounds";
import { generateUntilDone } from "../music-control";
import { Tool, TurnMove } from "../../types";
import { CPlayerSimple } from "../small-player-simple";

let meowSrcUrl: string | undefined;
export let winSoundSrcUrl: string | undefined;
export let loseSoundSrcUrl: string | undefined;

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

export async function initWinLoseSoundEffects() {
  if (!winSoundSrcUrl) {
    winSoundSrcUrl = await initSoundEffect(winSound);
  }

  if (!loseSoundSrcUrl) {
    loseSoundSrcUrl = await initSoundEffect(loseSound);
  }
}

async function initSoundEffect(soundDef: unknown) {
  const player = new CPlayerSimple();
  player.init(soundDef);

  await generateUntilDone(player);
  const wave = player.createWave();
  return URL.createObjectURL(new Blob([wave], { type: "audio/wav" }));
}
