# Welcome to Kittens United - a purrfect plan
This is the js13k entry for 2025

## Story
You step into the paws of Amara 🐈‍⬛, a mom of three, who wants to be united with her kittens.

- 💚 There is Ivy, who loves to run around the tree. 
- 🔷 Splashy, who loves water (which you dislike).
- 🟡 And Moony, who feels the gravity of the moon.

Can you catch them all before the moon sets and darkness falls? 🌙

## Controls
- On-screen buttons or keyboard
- Advanced keyboard shortcuts will be displayed once you press the first key

## About the level generation and difficulty
- All levels are randomly generated
- Each level is solvable within the move limit (once there is a move limit)
- Exception: you see a `?` instead of the move limit (no valid level found within 13 iterations, should rarely happen)
- The displayed difficulty is based on the number of solutions (how many paths lead to victory)
  - In the full version of the game, I have a more sophisticated difficulty system, including a slow increase based on the number of XP 🧶
  - But had to cut this to save some bytes
- Talking about 🧶, it's a simple XP system:
  - You win? `+10 🧶`
  - Difficulty bonus: `0 / +1 / +3`
  - Finished earlier: `+ leftover moves`
  - Retries: `- retries`
- You can "buy" a hint with 5 🧶 
  - This will highlight the best possible next move
  - or show a retry button if no move can lead to victory
