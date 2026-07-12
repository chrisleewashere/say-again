# Design Direction — "The Field Case" (Tier 2 · 3D immersion build)

Decisions locked with Chris (July 2026). This is the binding art/UX brief for the 3D build.
Anything not specified here follows from these choices; do not re-litigate them per-module.

## Premise

The whole game happens inside one physical object: a **1960s–70s analog spycraft briefcase**,
field-used, opened at the start of every mission. The Handler's printed manual is the other
half of the same fiction — a service manual for this exact piece of kit.

All art is original. We evoke the *era and craft* of analog espionage hardware — never any
existing game's assets, layouts, or trade dress.

## The object

- **Form:** a latched aluminum briefcase. Mission start = the latch ritual: clasps flip, lid
  opens, interior lights warm up one module at a time. Mission end = lid closes (soft) or
  alarm lockdown bars slide over the modules (soft failure — nothing is destroyed).
- **Anatomy:** modules mounted in both the base and lid on a standardized rack; a brass
  mission-code plate riveted inside the lid; alarm meter (analog needle + red jewel lamps) on
  the case spine; timer (when enabled) as a warm phosphor-tube readout, not a scary red LED.
- **Rotation is gameplay:** the case tilts/turns freely (touch drag, mouse drag, arrow keys).
  Selected info lives on the case's edges/back (etched serial plate, wear stickers, stamped
  codes) so "turn it over — what do you see?" is a real therapy moment.
- **Patina — field-used, specific and describable:** scuffed edges, paint worn around the
  most-pressed buttons, one non-matching replacement screw, a scratched-out inventory
  sticker, coffee ring on the lid interior. Wear is *evidence of use*, never dirt for dirt's
  sake — every mark is something a student could describe to their Handler.

## Materials & light

- **Materials:** brushed aluminum shell; bakelite/soft-touch phenolic module faceplates;
  glass over readouts; woven cable insulation; brass engraved labels. PBR throughout —
  roughness variation and edge wear do the storytelling.
- **Lighting:** one warm key light as if from a desk lamp, cool dim fill, subtle rim; HDR
  environment for honest metal reflections. The room beyond the case falls away to near-dark
  — the case is the world.
- **Glow:** warm phosphor amber-green for readouts (inherits the app's `--amber` family),
  small incandescent jewel lamps for module solved/alarm states (green = solved, red = alarm,
  always paired with a shape/label channel — color is never the only signal).
- **Post:** gentle bloom on lamps and phosphor, light vignette, a whisper of grain. No
  chromatic aberration, no lens-flare kitsch.

## Type & graphics on the object

- Engraved/stamped label style for hardware text (spacing-y uppercase, like machine-shop
  tags); phosphor-segment or nixie-style numerals for readouts. In-app UI (menus, SLP
  screens) keeps the existing design tokens — the analog world lives on the object.

## Sound (analog & mechanical)

- Latch clunk, relay clicks, tape-deck button thunk, dial detents, soft phosphor hum.
- Success: a satisfying mechanical *kachunk* + lamp ping. Strike: a single low relay buzz
  and the alarm needle sweep — tense, never a shriek. Timer low: soft metronome tick.
- Mix rules: no sound is punitive or startling (speech-therapy setting, sound-sensitive
  students). Master mute + separate music/SFX sliders ship in Settings from day one.
- Optional ambient bed: very low tape-machine room tone, off by default.

## Haptics (iPad)

Light tap on button presses, medium on module solve, firm double on strike, latch feel on
open/close. Follows the system reduce-motion/haptics settings.

## The module faceplate system (extensibility contract)

**Invariant: adding a module never requires 3D work.**

- Every module automatically gets a standard faceplate: phenolic panel, four corner screws,
  engraved codename tag, solved-lamp, mounted into the rack by the shell.
- `ModuleDefinition` gains an OPTIONAL `faceplate` descriptor: `{ slots: 1|2 (rack width),
  bezel?: 'standard'|'deep'|'flush', custom3D?: <opt-in in-scene presentation> }`.
  Defaults cover everything; `custom3D` is for flourishes (a physically snipped wire, a
  draggable dial) and is never required.
- Interaction model: tap a module → camera dollies in → the module's existing (tested,
  accessible) React UI takes over, styled to read as the faceplate up close. DOM-level
  interaction is preserved, so VoiceOver/Switch Control keep working.
- **Classic 2D mode** remains a Settings toggle (accessibility + low-end fallback) and must
  stay at feature parity — it is the same components, minus the shell.
- `npm run new-module` scaffolds a module folder (contract, tests, manual stubs) so new
  puzzle ideas go from concept to playable draft in one sitting.

## Performance posture

Design at full quality for A12+ iPads (2019+). Auto-degrade under sustained frame drops in
this order: shadows → post-processing → reflections; manual quality setting in Settings.
Never design down to the floor. Chromebooks: pointer + keyboard input are first-class.

## Ritual moments (motion budget lives here, not scattered)

1. **Case open** (mission start): clasps, lid, lamp warm-up sweep across modules.
2. **Module solve:** lamp ping + faceplate settles back into rack.
3. **Mission win:** all lamps green, needle relaxes, lid closes, brass plate stamps the
   mission code — debrief slides in.
4. **Alarm (soft fail):** needle pegs, lockdown bars slide, lamps amber — "regroup" debrief.
   Deliberately reads as *paused*, not destroyed.
All four honor reduced-motion (crossfade instead).
