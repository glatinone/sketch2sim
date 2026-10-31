import type { Part, Wire } from "../contract/types.ts";
import { UNO_ID, findPart } from "./catalog.ts";

// Uno at the origin, peripherals in a grid to its right. Not pretty, but never overlapping.
function layout(parts: Part[]): Map<string, { top: number; left: number }> {
  const pos = new Map<string, { top: number; left: number }>();
  pos.set(UNO_ID, { top: 0, left: 0 });
  const others = parts.filter((p) => p.id !== UNO_ID);
  const perColumn = 3;
  let x = 330;
  let y = -80;
  let inColumn = 0;
  let columnWidth = 0;
  for (const p of others) {
    const size = findPart(p.type)?.size ?? { w: 80, h: 80 };
    if (inColumn === perColumn) {
      x += columnWidth + 60;
      y = -80;
      inColumn = 0;
      columnWidth = 0;
    }
    pos.set(p.id, { top: y, left: x });
    y += size.h + 50;
    columnWidth = Math.max(columnWidth, size.w);
    inColumn++;
  }
  return pos;
}

export function buildDiagramJson(parts: Part[], wires: Wire[]): string {
  const pos = layout(parts);
  const diagram = {
    version: 1,
    author: "Sketch2Sim",
    editor: "wokwi",
    parts: parts.map((p) => ({
      type: p.type,
      id: p.id,
      top: pos.get(p.id)?.top ?? 0,
      left: pos.get(p.id)?.left ?? 0,
      ...(p.attrs && Object.keys(p.attrs).length ? { attrs: p.attrs } : {}),
    })),
    connections: wires.map((w) => [w.from, w.to, w.color, []]),
    dependencies: {},
  };
  return JSON.stringify(diagram, null, 2);
}

export function looksLikeArduinoSketch(code: string): boolean {
  return /void\s+setup\s*\(/.test(code) && /void\s+loop\s*\(/.test(code);
}

// Fallback firmware when Gemma's sketch is missing or broken: the first input drives every output.
export function fallbackSketch(parts: Part[], wires: Wire[]): string {
  const unoPin = (partId: string, pin: string) => {
    const end = `${partId}:${pin}`;
    const w = wires.find((x) => x.from === end || x.to === end);
    let other = w ? (w.from === end ? w.to : w.from) : undefined;
    // follow one resistor hop (Uno → resistor → LED)
    if (other && !other.startsWith(`${UNO_ID}:`)) {
      const [rid, rpin] = other.split(":");
      const far = `${rid}:${rpin === "1" ? "2" : "1"}`;
      const w2 = wires.find((x) => x.from === far || x.to === far);
      other = w2 ? (w2.from === far ? w2.to : w2.from) : undefined;
    }
    return other?.startsWith(`${UNO_ID}:`) ? other.split(":")[1] : undefined;
  };

  const decl: string[] = [];
  const setup: string[] = ["  Serial.begin(9600);"];
  const read: string[] = [];
  const write: string[] = [];
  let includeServo = false;
  let haveInput = false;

  for (const p of parts) {
    const n = p.id.toUpperCase();
    if (p.type === "wokwi-pushbutton" && !haveInput) {
      const pin = unoPin(p.id, "1.l") ?? unoPin(p.id, "1.r");
      if (!pin) continue;
      decl.push(`const int ${n}_PIN = ${pin};`);
      setup.push(`  pinMode(${n}_PIN, INPUT_PULLUP);`);
      read.push(`  int level = digitalRead(${n}_PIN) == LOW ? 100 : 0; // pressed = 100`);
      haveInput = true;
    } else if (p.type === "wokwi-potentiometer" && !haveInput) {
      const pin = unoPin(p.id, "SIG");
      if (!pin) continue;
      decl.push(`const int ${n}_PIN = ${pin};`);
      read.push(`  int level = map(analogRead(${n}_PIN), 0, 1023, 0, 100);`);
      haveInput = true;
    } else if (p.type === "wokwi-hc-sr04" && !haveInput) {
      const trig = unoPin(p.id, "TRIG");
      const echo = unoPin(p.id, "ECHO");
      if (!trig || !echo) continue;
      decl.push(`const int ${n}_TRIG = ${trig};`, `const int ${n}_ECHO = ${echo};`);
      setup.push(`  pinMode(${n}_TRIG, OUTPUT);`, `  pinMode(${n}_ECHO, INPUT);`);
      read.push(
        `  digitalWrite(${n}_TRIG, LOW); delayMicroseconds(2);`,
        `  digitalWrite(${n}_TRIG, HIGH); delayMicroseconds(10); digitalWrite(${n}_TRIG, LOW);`,
        `  long cm = pulseIn(${n}_ECHO, HIGH) / 58;`,
        `  int level = cm < 100 ? 100 - cm : 0; // closer = higher`,
      );
      haveInput = true;
    }
  }

  for (const p of parts) {
    const n = p.id.toUpperCase();
    if (p.type === "wokwi-led") {
      const pin = unoPin(p.id, "A");
      if (!pin) continue;
      decl.push(`const int ${n}_PIN = ${pin};`);
      setup.push(`  pinMode(${n}_PIN, OUTPUT);`);
      write.push(`  digitalWrite(${n}_PIN, level > 50 ? HIGH : LOW);`);
    } else if (p.type === "wokwi-buzzer") {
      const pin = unoPin(p.id, "2");
      if (!pin) continue;
      decl.push(`const int ${n}_PIN = ${pin};`);
      setup.push(`  pinMode(${n}_PIN, OUTPUT);`);
      write.push(`  if (level > 50) tone(${n}_PIN, 1000, 100); else noTone(${n}_PIN);`);
    } else if (p.type === "wokwi-servo") {
      const pin = unoPin(p.id, "PWM");
      if (!pin) continue;
      includeServo = true;
      decl.push(`Servo ${p.id};`);
      setup.push(`  ${p.id}.attach(${pin});`);
      write.push(`  ${p.id}.write(map(level, 0, 100, 0, 180));`);
    }
  }

  if (!haveInput) read.push("  int level = (millis() / 1000) % 2 ? 100 : 0; // no input: blink");

  return [
    "// Generated by Sketch2Sim (fallback template)",
    ...(includeServo ? ["#include <Servo.h>"] : []),
    "",
    ...decl,
    "",
    "void setup() {",
    ...setup,
    "}",
    "",
    "void loop() {",
    ...read,
    ...write,
    "  delay(50);",
    "}",
    "",
  ].join("\n");
}
