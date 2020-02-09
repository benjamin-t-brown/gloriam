-- Creating a Character --

A Character is an entity in the game which can walk around and speak. A Character may also have other animations.

1. Create a spritesheet

- Save the spritesheet to `anims/spritesheets/<characterName>.png`
  - Can save the Aseprite project here as well.
- Most "people" Characters are 64px by 64px
- The first frame on the spritesheet is the default sprite. This is shown when no animation is active.
- For most characters, this spritesheet must contain these bare minimum animations
  - Standing for all headings: up, right, left, down
  - Walking for all headings: up, right, left, down
  - Cadences for all headings: up, right, left down
- This spritesheet can contain any other animations for the Character as well

2. Use the Anims tool to define animations

- For the required animations, these must be named the following:
  - Standing for all headings: `<characterName>_(u|r|l|d)`
  - Walking for all headings: `<characterName>_walk_(u|r|l|d)`
  - Cadences: don't really matter as long as they are defined

3. Click the save button.

- To export them into the game, run `yarn export` in the anims directory

4. Create an entry in the character database.

- Open the file `game/src/db/characters.js`
- Add an entry at the bottom that looks like this:

```
  {
    const c = createTemplate(<characterName>);
    c.spriteBase = <spritesheetName>;
  }
```

5. Boom!

-- Creating a Room ---

A Room is a place in the game where a character can walk around. Rooms are JSON files that have been exported from the Tiled tool.

1. Create a Tiled tmx file for your room

- place it in `tiled/tmx/<roomName>.tmx`

2. Create a background and a foreground for the room.

- Save them to `tiled/stages/<roomName>-(bg|fg).png`
- These are png files roughly the size of 128x128 (or smaller).
- These images are placed in the back and the front respectively.

3. Create any props that you need for the room.

- A prop is a png file that represents something in the scene. The game loads props and draws them such that props at the bottom are rendered in front of props at the top.
- To create a prop, do the following:
  - draw an image (roughly 64px by 64px), name it after your prop
  - place it in the `tiled/props` folder
  - open Tiled and add your prop to the "props" tileset in `tiled/tmx/props.tsx`

4. Create the collision boxes for the room.

- These rectangles mark areas where a character cannot walk.
  - Collision boxes can overlap, but it is important to remember to mark objects as wider than they look so that characters cannot clip into props or walls

5. Create a Trigger file for your room.

- place this file in `game/db/scripts/map/scripts/<roomName>.rpgscript`
- Create a script called `@<roomName>`, this script runs every time the Room is loaded

6. Define triggers for entry and exit.

- Mark with rectangles the areas which are triggers in your room (see Creating a Trigger).
- Name these triggers `to-<roomName>`

7. Define the rest of your triggers.

- Draw a rectangle, and name the rectangle the same name as your trigger.

8. Export your your room to `game/db/scripts/map/rooms/<roomName>.json`
9. Yay! You're done!

-- Creating a Trigger --

A Trigger is a set of instructions that run when an event occurs in the game. This event can be one of three types: 'click', 'action', or 'step'

A 'click' happens when a user clicks a trigger. The player character faces the trigger, and the trigger is executed immediately.
An 'action' event happens when a user clicks a trigger. The player character walks to the base of the trigger, then activates the trigger.
A 'step' occurs when the player character collides with the trigger while they are walking.

Triggers are defined inside of \*.rpgscript files by prefixing a line with the '#' symbol. An example trigger looks like:

```
@readyroom-test
action,?all(isnot(this), eq(storage.battleNumber, 0)):readyroom-Weapons Rack 1
action,readyroom-Weapons Rack 2
```

Each line of the trigger is executed until a condition is met where a script is run. Then execution stops and any subsequent conditions are not evaluated.

-- Creating a Script --

A Script is a set of instructions that the game runs, usually as a an effect of a Trigger. Scripts are defined inside of \*.rpgscript files by prefixing a line with a '@' symbol. Each subsequent line should either be a line of dialog or a command. Commands are located in the `game/src/main/Scene.js`

-- Creating a Cadence --

A Cadence is a special set of frames that depict a character talking. It consists of three frames: one with mouth closed, one mouth half open, one mouth fully open.

1. Create a spritesheet with your character. Make sure your character's name is the name of the spritesheet.

- To be a complete set, it must contain a Cadence for each heading (3 sprites for each):
  - down, left, right, up

2. Place the spritesheet inside anims/spritesheets
3. Use the Anims tool to create the down, left, right, up Cadences
4. Click the 'Save' button in the Anims tool.

- run `yarn export` inside the Anim directory to export the cadences

5. You did it!

-- Creating a Cutscene With Voices --

A cutscene is a set of instructions that the game uses to control characters on the screen. A Cutscene consists of a script and looks like this:

```
@rvb
Simmons: "Hey."
Grif: "Yeah?"
Simmons: "You ever wonder why we're here?"
Grif: "It's one of life's great mysteries, isn't it."
Grif: "Why are we here?  I mean, are we the product of..."
+lookAt('Simmons', 'Grif');
Grif: "...some cosmic coincidence or..."
Grif: "is there really a God... watching everything?"
Grif: "You know, with a plan for us and stuff."
Grif: "I don't know man."
Grif: "But it keeps me up at night."
```

This script is called 'rvb'. For Each line where a character is talking, the game will show everything in quotes above the character for a predetermined amount of time. This happens continually until the cutscene finishes with the last line. The game looks for audio files corresponding to each line by looking up an audio file with the name `<scriptName>_<index>.wav` inside the `game/dist/snd` folder. "index" refers to the line in the script where the dialogue line was executed. This number increases by one for each line of dialogue, not for each line in the script. If the game finds such a file, it plays it.

To add voices to these characters:

1. Use Audacity to record each line of dialogue.

- Usually you'll do one person at a time.
  - Create an audacity file called `<sceneName>_<characterName>.aud`
  - Have the actor record each line for their character in Audacity.
  - Use the labeling feature to mark the take you want to use for each line.
    - Don't label it with any text
  - After your done,

2. Convert export names for the cutscene.

- Using the above as an example, you'll likely have 2 sets of files:
  - rvb_Simmons.wav, rvb_Simmons1.wav
  - rvb_Grif.wav...rvb_Grif7.wav
- The audacity convert script can turn these groups into one group of files with correct labeling
  - rvb_0.wav...rvb_9.wav
  - it will also place them in the correct director `game/dist/snd` and also the `puppets/sounds` directory for Cadences

3. Create Cadences for each sound file.

- Open up the Puppets tool and create a cadence for each sound file

4. Export Cadences

- run `yarn export` inside the Puppets directory to export the cadences

5. Ensure your characters have Cadence animations assigned to them
6. Run the scene :)
