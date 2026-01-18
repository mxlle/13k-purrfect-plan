import { FieldSize } from "./data/field-size";
import { ConfigItemId, Direction, TurnMove } from "../types";
import { allConfigItems } from "./config/config";

export interface LevelDefinition {
  fieldSize: FieldSize;
  configString: string;
  description: string;
  excludedConfigItems?: ConfigItemId[];
  highlightedAction?: TurnMove;
}

export const onboardingLevels: LevelDefinition[] = [
  {
    fieldSize: 3,
    configString: `🟣11🔵21🟢21🟡21`,
    description: "Onboarding Intro",
    excludedConfigItems: allConfigItems,
    highlightedAction: Direction.DOWN,
  },
  {
    fieldSize: 4,
    configString: `🟣12🔵32🟢31🟡32🌳22💧21`,
    description: "Onboarding Intermediate Objects",
    excludedConfigItems: allConfigItems,
  },
  {
    fieldSize: 5,
    configString: `🟣11🔵33🟢31🟡32🌳23💧21`,
    description: "Onboarding Last Setup",
    excludedConfigItems: allConfigItems,
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
