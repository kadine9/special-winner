import { Cloud, Star, Sparkles } from "lucide-react";
import { RainbowArc } from "./RainbowArc";

/**
 * Ambient background decoration: clouds, stars and sparkles that
 * slowly drift and twinkle behind the app content. Positions are a
 * fixed, hand-placed layout (not randomized) so server- and
 * client-rendered markup always match.
 */
type FloaterSpec = {
  id: string;
  top: string;
  left: string;
  size: number;
  opacity: number;
  duration: number;
  delay: number;
  kind: "cloud" | "star" | "sparkle" | "rainbow";
  color: string;
  hideOnMobile?: boolean;
};

const FLOATERS: FloaterSpec[] = [
  { id: "c1", top: "6%", left: "8%", size: 46, opacity: 0.55, duration: 15, delay: 0, kind: "cloud", color: "#8FC9EA" },
  { id: "c2", top: "14%", left: "78%", size: 60, opacity: 0.5, duration: 18, delay: 2, kind: "cloud", color: "#8FC9EA", hideOnMobile: true },
  { id: "c3", top: "68%", left: "4%", size: 38, opacity: 0.45, duration: 14, delay: 1, kind: "cloud", color: "#8FC9EA" },
  { id: "c4", top: "82%", left: "85%", size: 50, opacity: 0.5, duration: 17, delay: 3, kind: "cloud", color: "#8FC9EA", hideOnMobile: true },
  { id: "s1", top: "24%", left: "18%", size: 18, opacity: 0.8, duration: 4, delay: 0.4, kind: "star", color: "#FFC24B" },
  { id: "s2", top: "40%", left: "92%", size: 14, opacity: 0.7, duration: 5, delay: 1.2, kind: "star", color: "#FF7FB4" },
  { id: "s3", top: "88%", left: "40%", size: 16, opacity: 0.75, duration: 4.5, delay: 0.8, kind: "star", color: "#B85FCC" },
  { id: "sp1", top: "10%", left: "48%", size: 20, opacity: 0.6, duration: 6, delay: 0.6, kind: "sparkle", color: "#B85FCC" },
  { id: "sp2", top: "55%", left: "10%", size: 16, opacity: 0.55, duration: 5.5, delay: 1.6, kind: "sparkle", color: "#4FB6E0", hideOnMobile: true },
  { id: "r1", top: "30%", left: "4%", size: 40, opacity: 0.5, duration: 16, delay: 0.5, kind: "rainbow", color: "" },
];

export function Floaters() {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 z-0 overflow-hidden pointer-events-none"
    >
      {FLOATERS.map((f) => (
        <div
          key={f.id}
          className={`pony-floater ${f.duration > 10 ? "pony-floater-slow" : ""} ${
            f.hideOnMobile ? "hidden sm:block" : ""
          }`}
          style={{
            top: f.top,
            left: f.left,
            opacity: f.opacity,
            animationDuration: `${f.duration}s`,
            animationDelay: `${f.delay}s`,
          }}
        >
          {f.kind === "cloud" && <Cloud style={{ width: f.size, height: f.size, color: f.color }} strokeWidth={1.75} fill={f.color} fillOpacity={0.25} />}
          {f.kind === "star" && (
            <Star
              className="pony-floater-twinkle"
              style={{ width: f.size, height: f.size, color: f.color, animationDelay: `${f.delay}s` }}
              strokeWidth={1.75}
              fill={f.color}
            />
          )}
          {f.kind === "sparkle" && (
            <Sparkles
              className="pony-floater-twinkle"
              style={{ width: f.size, height: f.size, color: f.color, animationDelay: `${f.delay}s` }}
              strokeWidth={1.75}
            />
          )}
          {f.kind === "rainbow" && <RainbowArc style={{ width: f.size, height: f.size * 0.6 }} />}
        </div>
      ))}
    </div>
  );
}
