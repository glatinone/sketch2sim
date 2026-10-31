import type { CompileResult, CompileSketch } from "../contract/types.ts";

// Hard-coded, realistic result (button toggles LED on an Uno) so every UI state can be
// built and tested without the engine or an API key. Never shown in the real demo.
const diagram = {
  version: 1,
  author: "Sketch2Sim",
  editor: "wokwi",
  parts: [
    { type: "wokwi-arduino-uno", id: "uno", top: 0, left: 0, attrs: {} },
    { type: "wokwi-pushbutton", id: "btn1", top: -150, left: 40, attrs: { color: "green" } },
    { type: "wokwi-resistor", id: "r1", top: -110, left: 230, rotate: 90, attrs: { value: "220" } },
    { type: "wokwi-led", id: "led1", top: -190, left: 250, attrs: { color: "red" } },
  ],
  connections: [
    ["btn1:1.l", "uno:2", "green", []],
    ["btn1:2.r", "uno:GND.1", "black", []],
    ["uno:13", "r1:2", "orange", []],
    ["r1:1", "led1:A", "orange", []],
    ["led1:C", "uno:GND.2", "black", []],
  ],
  dependencies: {},
};

const sketch = `// Sketch2Sim — button toggles LED
const int BUTTON_PIN = 2;
const int LED_PIN = 13;

bool ledOn = false;
bool lastPressed = false;

void setup() {
  pinMode(BUTTON_PIN, INPUT_PULLUP); // pressed = LOW
  pinMode(LED_PIN, OUTPUT);
}

void loop() {
  bool pressed = digitalRead(BUTTON_PIN) == LOW;
  if (pressed && !lastPressed) {
    ledOn = !ledOn;
    digitalWrite(LED_PIN, ledOn ? HIGH : LOW);
    delay(30); // debounce
  }
  lastPressed = pressed;
}
`;

export const MOCK_RESULT: CompileResult = {
  projectTitle: "Button toggles LED",
  summary: "Pressing the push button toggles a red LED on and off. The button uses the Uno's internal pull-up, so no extra resistor is needed.",
  board: "uno",
  parts: [
    { id: "uno", type: "wokwi-arduino-uno", label: "Arduino Uno" },
    { id: "btn1", type: "wokwi-pushbutton", label: "Push button", attrs: { color: "green" } },
    { id: "r1", type: "wokwi-resistor", label: "220Ω resistor", attrs: { value: "220" } },
    { id: "led1", type: "wokwi-led", label: "Red LED", attrs: { color: "red" } },
  ],
  wires: [
    { from: "btn1:1.l", to: "uno:2", color: "green", signal: "DIGITAL", rationale: "D2 is a plain digital input; INPUT_PULLUP means no external resistor." },
    { from: "btn1:2.r", to: "uno:GND.1", color: "black", signal: "GND", rationale: "Pressing the button pulls D2 to ground (reads LOW)." },
    { from: "uno:13", to: "r1:2", color: "orange", signal: "DIGITAL", rationale: "D13 drives the LED; it is also the on-board LED pin, handy for debugging." },
    { from: "r1:1", to: "led1:A", color: "orange", signal: "DIGITAL", rationale: "220Ω limits LED current to ~14 mA at 5 V." },
    { from: "led1:C", to: "uno:GND.2", color: "black", signal: "GND", rationale: "LED cathode returns to ground." },
  ],
  diagramJson: JSON.stringify(diagram, null, 2),
  sketchIno: sketch,
  notes: [
    "Always put a 220–330Ω resistor in series with an LED on a 5 V pin.",
    "INPUT_PULLUP inverts the logic: pressed reads LOW.",
    "Software debounce (30 ms) avoids double toggles from contact bounce.",
  ],
  fixes: [
    { what: "Pin name normalised to Wokwi alias", before: "uno:D13", after: "uno:13" },
    { what: "Added series resistor the sketch omitted", before: "uno:13 → led1:A", after: "uno:13 → r1 → led1:A" },
    { what: "Ambiguous ground resolved", before: "uno:GND", after: "uno:GND.2" },
  ],
  source: "live",
  latencyMs: 0,
  modelId: "mock (UI dev)",
};

export const mockCompile: CompileSketch = async (input) => {
  const t0 = performance.now();
  await new Promise((r) => setTimeout(r, 1500));
  return { ...MOCK_RESULT, board: input.board, latencyMs: Math.round(performance.now() - t0) };
};
