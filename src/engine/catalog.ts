// Whitelist of Wokwi parts the engine accepts. Pin names must match Wokwi exactly,
// otherwise the pasted diagram.json silently drops wires.
// Verified against wokwi-docs + wokwi-cli diagram-lint registry (see probe/wokwi-research.md).
// Pushbutton: 1.l<->1.r and 2.l<->2.r are internally joined; pressing joins side 1 to side 2.

export type PinRole = "GND" | "POWER" | "SIGNAL";

export interface CatalogPart {
  type: string;
  label: string;
  keywords: string[]; // used to map a hallucinated type ("led", "pir", "ultrasonic") to a catalog type
  pins: Record<string, PinRole>;
  aliases: Record<string, string>; // lowercase alias -> real pin
  requiredPower?: Record<string, "GND" | "5V">; // pins that must be wired to Uno power if the model forgot
  defaultAttrs?: Record<string, string>;
  size: { w: number; h: number }; // approx Wokwi units, for auto-layout
}

export const UNO_ID = "uno";

export const UNO_DIGITAL = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13"]; // 0/1 = serial, never used
export const UNO_PWM = ["3", "5", "6", "9", "10", "11"];
export const UNO_ANALOG = ["A0", "A1", "A2", "A3", "A4", "A5"];
export const UNO_GND = ["GND.1", "GND.2", "GND.3"];

export const UNO: CatalogPart = {
  type: "wokwi-arduino-uno",
  label: "Arduino Uno",
  keywords: ["arduino", "uno", "mcu", "microcontroller", "board", "esp32", "nano", "mega"],
  pins: {
    ...Object.fromEntries(["0", "1", ...UNO_DIGITAL, ...UNO_ANALOG].map((p) => [p, "SIGNAL" as PinRole])),
    "5V": "POWER",
    "3.3V": "POWER",
    VIN: "POWER",
    "GND.1": "GND",
    "GND.2": "GND",
    "GND.3": "GND",
  },
  aliases: {
    gnd: "GND.1",
    ground: "GND.1",
    "5v": "5V",
    vcc: "5V",
    "+5v": "5V",
    "3v3": "5V", // 3.3V is not simulated in Wokwi
    "3.3v": "5V",
    vin: "VIN",
  },
  size: { w: 275, h: 200 },
};

export const PARTS: CatalogPart[] = [
  {
    type: "wokwi-led",
    label: "LED",
    keywords: ["led", "light", "lamp", "indicator"],
    pins: { A: "SIGNAL", C: "GND" },
    aliases: { anode: "A", "+": "A", a: "A", cathode: "C", "-": "C", c: "C", k: "C", gnd: "C" },
    requiredPower: { C: "GND" },
    defaultAttrs: { color: "red" },
    size: { w: 40, h: 50 },
  },
  {
    type: "wokwi-resistor",
    label: "Resistor",
    keywords: ["resistor", "res", "ohm"],
    pins: { "1": "SIGNAL", "2": "SIGNAL" },
    aliases: { a: "1", b: "2", left: "1", right: "2" },
    defaultAttrs: { value: "220" },
    size: { w: 60, h: 15 },
  },
  {
    type: "wokwi-pushbutton",
    label: "Push button",
    keywords: ["button", "pushbutton", "switch", "btn", "key", "keypad"],
    pins: { "1.l": "SIGNAL", "1.r": "SIGNAL", "2.l": "GND", "2.r": "GND" },
    aliases: { "1": "1.l", "2": "2.l", a: "1.l", b: "2.l", in: "1.l", out: "2.l", gnd: "2.l", sig: "1.l" },
    requiredPower: { "2.l": "GND" },
    defaultAttrs: { color: "green" },
    size: { w: 70, h: 50 },
  },
  {
    type: "wokwi-buzzer",
    label: "Buzzer",
    keywords: ["buzzer", "speaker", "piezo", "beeper", "alarm", "siren", "sirene"],
    pins: { "1": "GND", "2": "SIGNAL" },
    aliases: { "-": "1", gnd: "1", "+": "2", sig: "2", signal: "2" },
    requiredPower: { "1": "GND" },
    size: { w: 60, h: 60 },
  },
  {
    type: "wokwi-potentiometer",
    label: "Potentiometer",
    keywords: ["potentiometer", "pot", "knob", "dial", "slider"],
    pins: { GND: "GND", SIG: "SIGNAL", VCC: "POWER" },
    aliases: { gnd: "GND", sig: "SIG", out: "SIG", wiper: "SIG", vcc: "VCC", "5v": "VCC", "+": "VCC" },
    requiredPower: { GND: "GND", VCC: "5V" },
    size: { w: 60, h: 70 },
  },
  {
    type: "wokwi-servo",
    label: "Servo",
    keywords: ["servo", "motor", "gate", "arm"],
    pins: { GND: "GND", "V+": "POWER", PWM: "SIGNAL" },
    aliases: { gnd: "GND", vcc: "V+", "5v": "V+", "+": "V+", "v+": "V+", pwm: "PWM", sig: "PWM", signal: "PWM" },
    requiredPower: { GND: "GND", "V+": "5V" },
    size: { w: 150, h: 70 },
  },
  {
    type: "wokwi-hc-sr04",
    label: "Ultrasonic sensor",
    keywords: ["hc-sr04", "hcsr04", "ultrasonic", "distance", "sonar", "range"],
    pins: { VCC: "POWER", TRIG: "SIGNAL", ECHO: "SIGNAL", GND: "GND" },
    aliases: { vcc: "VCC", "5v": "VCC", trig: "TRIG", trigger: "TRIG", echo: "ECHO", gnd: "GND" },
    requiredPower: { VCC: "5V", GND: "GND" },
    size: { w: 150, h: 80 },
  },
  {
    type: "wokwi-dht22",
    label: "Temperature & humidity sensor",
    keywords: ["dht22", "dht11", "dht", "temperature", "temp", "humidity", "thermometer"],
    pins: { VCC: "POWER", SDA: "SIGNAL", NC: "SIGNAL", GND: "GND" },
    aliases: { vcc: "VCC", "5v": "VCC", sda: "SDA", data: "SDA", out: "SDA", sig: "SDA", gnd: "GND" },
    requiredPower: { VCC: "5V", GND: "GND" },
    size: { w: 60, h: 100 },
  },
];

export const ALL_PARTS: CatalogPart[] = [UNO, ...PARTS];

export function findPart(type: string): CatalogPart | undefined {
  return ALL_PARTS.find((p) => p.type === type);
}

// Map a model-invented type to a catalog part, e.g. "led" / "wokwi-led-red" / "HC-SR04 sensor".
export function matchPart(rawType: string, label = ""): CatalogPart | undefined {
  const exact = findPart(rawType);
  if (exact) return exact;
  const hay = `${rawType} ${label}`.toLowerCase();
  // longest keyword wins so "pushbutton" beats "button" and "hc-sr04" beats "sensor"
  let best: { part: CatalogPart; len: number } | undefined;
  for (const part of ALL_PARTS) {
    for (const kw of part.keywords) {
      if (hay.includes(kw) && (!best || kw.length > best.len)) best = { part, len: kw.length };
    }
  }
  return best?.part;
}

export function normalizePin(part: CatalogPart, rawPin: string): string | undefined {
  const pin = rawPin.trim();
  if (pin in part.pins) return pin;
  const lower = pin.toLowerCase();
  if (part.aliases[lower]) return part.aliases[lower];
  const caseInsensitive = Object.keys(part.pins).find((p) => p.toLowerCase() === lower);
  if (caseInsensitive) return caseInsensitive;
  if (part === UNO) {
    // "D13", "pin 13", "GPIO13" -> "13";  "a0" -> "A0"
    const digital = lower.match(/^(?:d|pin\s*|gpio)?(\d{1,2})$/);
    if (digital && digital[1] in part.pins) return digital[1];
    const gnd = lower.match(/^gnd[._ ]?(\d)$/);
    if (gnd && `GND.${gnd[1]}` in part.pins) return `GND.${gnd[1]}`;
  }
  return undefined;
}

// Compact table injected into the prompt so Gemma only picks parts/pins we can validate.
export function catalogForPrompt(): string {
  return ALL_PARTS.map((p) => {
    const pins = p === UNO
      ? `digital 2-13 (PWM: ${UNO_PWM.join(",")}), analog A0-A5, 5V, GND.1, GND.2, GND.3 (3.3V is not simulated: always use 5V)`
      : Object.keys(p.pins).join(", ");
    const attrs = p.defaultAttrs ? ` attrs e.g. ${JSON.stringify(p.defaultAttrs)}` : "";
    return `- ${p.type} (${p.label}): pins ${pins}${attrs}`;
  }).join("\n");
}
