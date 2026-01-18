import { FieldSize } from "./data/field-size";
import { ConfigItemId, Direction, Tool, TurnMove } from "../types";
import { allConfigItems, configItemsWithout } from "./config/config";
import { MoveLimit } from "./config/move-limit";
import { CatId, KittenId } from "./data/catId";

export interface LevelDefinition {
  fieldSize: FieldSize;
  configString: string;
  description: string;
  excludedConfigItems?: ConfigItemId[];
  highlightedAction?: TurnMove;
}

const ml: MoveLimit[] = [MoveLimit.MOVE_LIMIT_SIMPLE, MoveLimit.MOVE_LIMIT_STRICT];
const kt: KittenId[] = [CatId.MOONY, CatId.IVY, CatId.SPLASHY];

export const onboardingLevels: LevelDefinition[] = [
  {
    description: "Intro",
    fieldSize: 3,
    configString: `🟣11🔵21🟢21🟡21`,
    excludedConfigItems: allConfigItems,
    highlightedAction: Direction.DOWN,
  },
  {
    description: "Tree and Puddle",
    fieldSize: 4,
    configString: `🟣12🔵32🟢31🟡32🌳22💧21`,
    excludedConfigItems: allConfigItems,
  },
  {
    description: "Ivy's personality",
    fieldSize: 5,
    configString: `🟣11🔵23🟢12🟡33🌳22💧44`,
    excludedConfigItems: configItemsWithout([CatId.IVY]),
  },
  {
    description: "Meow",
    fieldSize: 5,
    configString: `🟣11🔵23🟢12🟡33🌳22💧44`,
    excludedConfigItems: configItemsWithout([CatId.IVY, Tool.MEOW]),
    highlightedAction: Tool.MEOW,
  },
  {
    description: "Splashy's personality",
    fieldSize: 5,
    configString: `🟣13🔵30🟢03🟡11🌳12💧32`,
    excludedConfigItems: configItemsWithout([CatId.IVY, Tool.MEOW, CatId.SPLASHY]),
  },
  {
    description: "Ivy's personality",
    fieldSize: 5,
    configString: `🟣12🔵20🟢23🟡10🌳31💧24`,
    excludedConfigItems: configItemsWithout([...kt, Tool.MEOW, MoveLimit.MOVE_LIMIT_SIMPLE]),
  },
  {
    description: "Wait",
    fieldSize: 5,
    configString: `🟣04🔵21🟢23🟡10🌙00🌳14💧03`,
    excludedConfigItems: configItemsWithout([...kt, Tool.MEOW, Tool.WAIT, MoveLimit.MOVE_LIMIT_SIMPLE]),
    highlightedAction: Tool.WAIT,
  },
  {
    description: "Move limit",
    fieldSize: 5,
    configString: `🟣12🔵41🟢24🟡20🌙00🌳23💧21`,
  },
];

const advancedLevels: LevelDefinition[] = [
  { fieldSize: 5, configString: `🟣04🔵03🟢43🟡30🌙00🌳32💧34`, description: "" },
  { fieldSize: 5, configString: `🟣24🔵43🟢03🟡40🌙00🌳21💧20`, description: "" },
  { fieldSize: 5, configString: `🟣02🔵31🟢32🟡33🌙00🌳12💧13`, description: "" },
  { fieldSize: 5, configString: `🟣30🔵02🟢11🟡41🌙00🌳23💧24`, description: "" },
  { fieldSize: 5, configString: `🟣30🔵03🟢41🟡33🌙00🌳13💧21`, description: "" },
  { fieldSize: 5, configString: `🟣22🔵23🟢33🟡14🌙00🌳32💧21`, description: "" },
  { fieldSize: 5, configString: `🟣21🔵20🟢24🟡03🌙00🌳22💧31`, description: "" },
  { fieldSize: 5, configString: `🟣03🔵34🟢04🟡21🌙01🌳11💧22`, description: "" },
  { fieldSize: 5, configString: `🟣22🔵20🟢31🟡11🌙02🌳32💧14`, description: "" },
  { fieldSize: 5, configString: `🟣14🔵22🟢04🟡44🌙02🌳13💧24`, description: "Trap" },
  { fieldSize: 5, configString: `🟣22🔵24🟢11🟡42🌙03🌳21💧23`, description: "Short" },
  { fieldSize: 5, configString: `🟣21🔵24🟢13🟡02🌙32🌳12💧22`, description: "Upside down" },
  { fieldSize: 5, configString: `🟣12🔵32🟢23🟡21🌙40🌳22💧04`, description: "Upside down long" },
];

export const levels: LevelDefinition[] = [...onboardingLevels, ...advancedLevels];
