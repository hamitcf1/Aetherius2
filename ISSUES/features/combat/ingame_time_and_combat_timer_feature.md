Feature: Combat — In-game time and combat timer match

Overview:

Currently, the World Time (In-game clock) and the Combat Module Timer operate independently. This ticket covers the implementation of a synchronization bridge that adds the total duration of a combat encounter to the global World Time upon combat resolution (Win/Loss/Escape).

User stories:

As a player, I want the in-game world clock to progress based on the time I spent in battle so that the game world feels persistent and my time-sensitive quests or day/night cycles remain accurate.

Scope:

In-scope:

Time Bridge Logic: Develop a listener that captures the Total_Combat_Duration upon the OnCombatEnd event if it does not exist.

World Time Injection: A method to add Combat_Time to the Global_World_Timer.

State Handling: Synchronization must trigger regardless of the outcome (Victory, Defeat, or Fleeing).

Out-of-scope:

Visual "Time-lapse" animations during the transition.

Modifying NPC schedules during the combat sequence (NPCs will update only after returning to the world).

Design/Mock links:

Acceptance criteria:

Sync Verification: If combat lasts 120 seconds, the World Clock must be exactly 120 seconds (or a scaled equivalent) further ahead upon returning to the overworld.

Outcome Agnostic: The time sync must execute successfully during the FinalizeCombat or existing function call, whether the player wins or loses.

Scale Calibration: The system must support time scaling (e.g., if 1 minute of real-time combat equals 10 minutes of in-game time).

Save Data Integrity: The updated World Time must be persisted to the save file immediately after synchronization.

Telemetry / Metrics:

Average Combat Duration: Track how much world time is being "consumed" by combat on average.

Sync Failure Rate: Log instances where the OnCombatEnd event fails to update the global clock.

Session Drift: Compare Total_Play_Time vs World_Time_Progression to ensure the sync isn't over or under-calculating.

Screenshots:

https://uploads.linear.app/5ff30419-54e3-421b-8a37-2b567239af94/ec1e6968-e7a1-4cfa-ac50-bb85ab908d85/00781ee7-91a6-45b0-a986-6b97e7103a2f?signature=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwYXRoIjoiLzVmZjMwNDE5LTU0ZTMtNDIxYi04YTM3LTJiNTY3MjM5YWY5NC9lYzFlNjk2OC1lN2ExLTRjZmEtYWM1MC1iYjg1YWI5MDhkODUvMDA3ODFlZTctOTFhNi00NWIwLWE5ODYtNmI5N2U3MTAzYTJmIiwiaWF0IjoxNzY4NDc0MzYwLCJleHAiOjE4MDAwNDQ5MjB9.u2eBGy7XTAvJCkVh0au_NQSxKNVmauArXXA34Br3vhA

