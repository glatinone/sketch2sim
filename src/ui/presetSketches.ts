// The three demo presets, drawn with the same stamps + pen a user has in the app,
// so the exported PNGs look like real user input. Rendered to public/presets/*.png by
// tools/gen-presets.html (see README › Presets).
import { handLine, handPath, type Op } from "./sketchOps.ts";

const note = (text: string, x: number, y: number, size = 28): Op => ({ kind: "text", text, x, y, size });
const stamp = (label: string, x: number, y: number): Op => ({ kind: "stamp", label, x, y });

export const PRESET_SKETCHES: Record<string, Op[]> = {
  "blink-button": [
    note("button toggles LED", 60, 70, 40),
    stamp("UNO", 300, 420),
    stamp("BUTTON", 860, 240),
    stamp("LED", 860, 600),
    // UNO -> BUTTON (signal) and BUTTON -> GND
    handPath([{ x: 360, y: 400 }, { x: 560, y: 400 }, { x: 560, y: 250 }, { x: 765, y: 250 }], 11),
    note("D2", 580, 320),
    handLine({ x: 955, y: 240 }, { x: 1080, y: 240 }, 12),
    note("GND", 1090, 240, 26),
    // UNO -> LED (signal) and LED -> GND
    handPath([{ x: 360, y: 440 }, { x: 560, y: 440 }, { x: 560, y: 600 }, { x: 800, y: 600 }], 13),
    note("D13", 580, 530),
    handLine({ x: 920, y: 600 }, { x: 1060, y: 600 }, 14),
    note("GND", 1070, 600, 26),
  ],
  "parking-sensor": [
    note("parking sensor: closer = beep faster", 60, 70, 38),
    stamp("UNO", 280, 440),
    stamp("ULTRASONIC", 850, 200),
    stamp("BUZZER", 850, 450),
    stamp("LED", 850, 680),
    handPath([{ x: 340, y: 410 }, { x: 520, y: 410 }, { x: 520, y: 200 }, { x: 715, y: 200 }], 21),
    note("TRIG / ECHO", 535, 160, 24),
    handLine({ x: 340, y: 450 }, { x: 760, y: 450 }, 22),
    note("beep", 560, 420, 24),
    handPath([{ x: 340, y: 480 }, { x: 520, y: 480 }, { x: 520, y: 680 }, { x: 800, y: 680 }], 23),
    note("LED on when close", 545, 740, 24),
  ],
  "servo-pot": [
    note("knob turns servo", 60, 70, 40),
    stamp("POT", 230, 260),
    stamp("UNO", 600, 520),
    stamp("SERVO", 980, 260),
    handPath([{ x: 230, y: 300 }, { x: 230, y: 520 }, { x: 540, y: 520 }], 31),
    note("A0", 300, 480),
    handPath([{ x: 660, y: 520 }, { x: 980, y: 520 }, { x: 980, y: 300 }], 32),
    note("PWM", 780, 480),
    note("turn knob -> servo angle 0..180", 330, 720, 30),
  ],
};
