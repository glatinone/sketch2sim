import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { Backdrop, Big, clamp, ease, useSpring } from "../components/ui";
import { wordAt } from "../timing";
import { C, MONO } from "../theme";

// The pain: one idea per card, each card lands on the spoken word; earlier cards stack up as a growing to-do pile.
export const Problem: React.FC = () => {
  const f = useCurrentFrame();
  const photo = useSpring(0, { damping: 22 });
  const cards = [
    { at: wordAt("S2", "picking"), text: "Pick the pins" },
    { at: wordAt("S2", "adding"), text: "Add resistors" },
    { at: wordAt("S2", "writing"), text: "Write firmware" },
    { at: wordAt("S2", "hunting"), text: "Find the backwards wire" },
  ];
  const slowAt = wordAt("S2", "slow");
  const napkinAt = wordAt("S2", "paper");
  const introOut = interpolate(f, [cards[0].at - 8, cards[0].at], [1, 0], clamp);
  const active = cards.filter((c) => f >= c.at).length - 1;
  const springs = cards.map((c) => useSpring(c.at, { damping: 15, stiffness: 170 }));

  return (
    <AbsoluteFill>
      <Backdrop hue="amber" />
      {/* real notebook sketch (one of our demo inputs) */}
      <div
        style={{
          position: "absolute",
          left: 110,
          top: 170,
          width: 780,
          transform: `rotate(${-5 + photo * 2}deg) translateX(${(1 - photo) * -200}px) scale(${1 + f / 3000})`,
          opacity: photo,
          borderRadius: 14,
          overflow: "hidden",
          boxShadow: "0 40px 100px rgba(0,0,0,.7)",
        }}
      >
        <Img src={staticFile("sketches/01-traffic-light.jpg")} style={{ width: "100%", display: "block" }} />
      </div>

      <div style={{ position: "absolute", left: 1000, right: 110, top: 0, bottom: 0, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        {/* intro: paper sketch → circuit, with a crawling progress bar on "the slow part" */}
        <div style={{ opacity: introOut, position: "absolute", top: 380 }}>
          <Big size={92} style={{ opacity: ease(f, 6, 20), transform: `translateY(${(1 - ease(f, 6, 20)) * 20}px)` }}>
            Paper sketch<br /><span style={{ color: napkinAt <= f ? C.amber : C.dim }}>→</span> circuit
          </Big>
          <div style={{ marginTop: 40, width: 700, height: 14, borderRadius: 99, background: C.line, overflow: "hidden", opacity: ease(f, slowAt - 6, slowAt + 4) }}>
            <div style={{ width: `${interpolate(f, [slowAt, slowAt + 80], [2, 22], clamp)}%`, height: "100%", background: C.amber, borderRadius: 99 }} />
          </div>
          <div style={{ marginTop: 18, fontFamily: MONO, fontSize: 28, color: C.amber, opacity: ease(f, slowAt, slowAt + 10) }}>the slow part</div>
        </div>

        {/* to-do pile */}
        <div style={{ position: "absolute", top: 250, display: "flex", flexDirection: "column", gap: 18 }}>
          {cards.map((c, i) => {
            if (f < c.at) return null;
            const k = springs[i];
            const isActive = i === active;
            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 26,
                  opacity: k * (isActive ? 1 : 0.42),
                  transform: `translateX(${(1 - k) * 120}px) scale(${isActive ? 1 : 0.92})`,
                  transformOrigin: "left center",
                }}
              >
                <span style={{ fontFamily: MONO, fontSize: 30, color: i === 3 ? C.rose : C.amber, width: 56 }}>0{i + 1}</span>
                <Big size={i === 3 && isActive ? 84 : 72} color={i === 3 && isActive ? C.rose : C.text}>
                  {c.text}
                </Big>
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};
