# Welcome to Kittens United - a purrfect plan
This is the js13k entry for 2025

## Story
Step into the paws of Amara 🐈‍⬛ — a devoted mom on a mission to reunite with her three playful kittens.

- 💚 Ivy, the energetic climber who’s always circling the tree.
- 🔷 Splashy, a water-loving rascal (much to your dismay).
- 🟡 Moony, who seems forever attracted by the moon’s mysterious pull.

Can you bring them all back together before the moon sets and darkness falls? 🌙

## Controls
- On-screen buttons or keyboard
- Advanced keyboard shortcuts will be displayed once you press the first key

## About the level generation and difficulty
- All levels are randomly generated
- Each level is solvable within the move limit (once there is a move limit). Exception: If you see a ? for the move limit, it means no valid level was found after 13 tries — this should be very rare.
- The displayed difficulty is based on the number of solutions (how many paths lead to victory)
- The full version of the game uses a more advanced difficulty system that slowly scales with your XP 🧶, but I had to simplify this to save some bytes
- Speaking of 🧶, it's a simple XP system:
  - Win: `+10 🧶`
  - Difficulty bonus: `+0 / +1 / +3`
  - Extra moves left: `+ leftover moves`
  - Retries: `- retries`
- You can "buy" a hint with 5 🧶 
  - This will highlight the best possible next move or show a retry button if no move can lead to victory
