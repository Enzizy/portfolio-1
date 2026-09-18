export type LetterResult = "correct" | "present" | "absent";

const DAILY_WORDS = [
  "APPLE", "BEACH", "BLOOM", "BRAVE", "BREAD", "BRICK", "BRUSH", "CANDY", "CHAIR", "CHARM",
  "CHESS", "CLOUD", "CORAL", "CRANE", "DANCE", "DREAM", "EARTH", "FLAME", "FLOAT", "FROST",
  "FRUIT", "GIANT", "GLASS", "GLOBE", "GRAPE", "GREEN", "HONEY", "HORSE", "HOUSE", "JUICE",
  "KNIFE", "LASER", "LEMON", "LIGHT", "LUNCH", "MAGIC", "MANGO", "MAPLE", "MARCH", "MUSIC",
  "NIGHT", "OCEAN", "OLIVE", "PAINT", "PANDA", "PEARL", "PIANO", "PILOT", "PIZZA", "PLANT",
  "PRIDE", "QUEST", "QUIET", "RADIO", "RIVER", "ROBOT", "ROUND", "SCALE", "SHARE", "SHINE",
  "SHEEP", "SMILE", "SNAKE", "SOLAR", "SPACE", "SPARK", "SPOON", "STORM", "SUGAR", "SWEET",
  "TABLE", "TIGER", "TOAST", "TRAIN", "TRAIL", "TRUCK", "WATER", "WHALE", "WHEAT", "WORLD",
] as const;

export function dailyWordFor(date: Date) {
  const day = Math.floor(date.getTime() / 86_400_000);
  return DAILY_WORDS[((day * 13) % DAILY_WORDS.length + DAILY_WORDS.length) % DAILY_WORDS.length];
}

export function scoreGuess(guess: string, answer: string): LetterResult[] {
  const result: LetterResult[] = Array(5).fill("absent");
  const remaining = new Map<string, number>();

  for (let i = 0; i < 5; i++) {
    if (guess[i] === answer[i]) result[i] = "correct";
    else remaining.set(answer[i], (remaining.get(answer[i]) ?? 0) + 1);
  }

  for (let i = 0; i < 5; i++) {
    if (result[i] === "correct") continue;
    const count = remaining.get(guess[i]) ?? 0;
    if (count > 0) {
      result[i] = "present";
      remaining.set(guess[i], count - 1);
    }
  }

  return result;
}
