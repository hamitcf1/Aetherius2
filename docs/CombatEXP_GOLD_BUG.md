Bug: <Mechanics> — Combat exp and gold rewards not adding to player
Upon successful completion of a combat encounter, the rewards (Experience Points and Gold) displayed in the "Combat Results" screen are not being committed to the player's permanent data profile. The player's level and balance remain unchanged after returning to the world map.

Steps to Reproduce

Note current Gold and EXP values in the main menu.

Enter a combat encounter.

Defeat all enemies to reach the Victory Screen.

Observe the rewards shown (e.g., "+50 EXP", "+20 Gold").

Return to the Overworld/Main Menu and check Gold and EXP values again.

Actual Result: Gold and EXP values are identical to the values recorded in Step 1. 

Expected Result: Gold and EXP values should be the sum of Step 1 + the rewards earned in Step 4.

Root Cause Hypotheses:

Missing Commit Call: The CombatManager calculates the rewards but never triggers the PlayerService.AddRewards() method.

Session Desync: The rewards are added to a "Temporary Session Object" that is destroyed when the combat scene is unloaded, rather than being saved to the "Persistent Player Profile."

Race Condition: The scene transition (loading the world map) happens faster than the database "Write" operation, causing the save to be aborted.

Acceptance Criteria

Data Persistence: Verification that Player_Gold and Player_EXP variables in the database/save-file increase by the exact amount earned in combat.

State Consistency: Rewards must be added before the combat scene is fully destroyed to prevent data loss.

UI Sync: The main HUD must immediately reflect the new values upon returning from combat without requiring a game restart.

Error Handling: If the reward "Write" operation fails, the game should retry or log a high-priority error instead of failing silently.

Multi-kill Validation: Ensure that EXP/Gold from all enemies in an encounter are summed correctly, not just the last enemy killed.
Upon successful completion of a combat encounter, the rewards (Experience Points and Gold) displayed in the "Combat Results" screen are not being committed to the player's permanent data profile. The player's level and balance remain unchanged after returning to the world map.

Steps to Reproduce

Note current Gold and EXP values in the main menu.

Enter a combat encounter.

Defeat all enemies to reach the Victory Screen.

Observe the rewards shown (e.g., "+50 EXP", "+20 Gold").

Return to the Overworld/Main Menu and check Gold and EXP values again.

Actual Result: Gold and EXP values are identical to the values recorded in Step 1. 

Expected Result: Gold and EXP values should be the sum of Step 1 + the rewards earned in Step 4.

Root Cause Hypotheses:

Missing Commit Call: The CombatManager calculates the rewards but never triggers the PlayerService.AddRewards() method.

Session Desync: The rewards are added to a "Temporary Session Object" that is destroyed when the combat scene is unloaded, rather than being saved to the "Persistent Player Profile."

Race Condition: The scene transition (loading the world map) happens faster than the database "Write" operation, causing the save to be aborted.

Acceptance Criteria

Data Persistence: Verification that Player_Gold and Player_EXP variables in the database/save-file increase by the exact amount earned in combat.

State Consistency: Rewards must be added before the combat scene is fully destroyed to prevent data loss.

UI Sync: The main HUD must immediately reflect the new values upon returning from combat without requiring a game restart.

Error Handling: If the reward "Write" operation fails, the game should retry or log a high-priority error instead of failing silently.

Multi-kill Validation: Ensure that EXP/Gold from all enemies in an encounter are summed correctly, not just the last enemy killed.