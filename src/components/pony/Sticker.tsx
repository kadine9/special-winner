import { Star, Heart, Sparkles, Cloud } from "lucide-react";
import { RainbowArc } from "./RainbowArc";
import { cn } from "@/lib/utils";

export type StickerVariant = "star" | "heart" | "sparkle" | "cloud" | "rainbow";

const STICKER_STYLE: Record<StickerVariant, { bg: string; fg: string }> = {
  star: { bg: "linear-gradient(145deg,#FFDA82,#FFB020)", fg: "#5B3B00" },
  heart: { bg: "linear-gradient(145deg,#FFA9CB,#FF6FA5)", fg: "#5C0F30" },
  sparkle: { bg: "linear-gradient(145deg,#D9B3FF,#B85FCC)", fg: "#3B0A4D" },
  cloud: { bg: "linear-gradient(145deg,#CFEBFF,#7FCBEE)", fg: "#0E3A4A" },
  rainbow: { bg: "linear-gradient(145deg,#FFFFFF,#F1E6FF)", fg: "#402C55" },
};

const SIZE_PX: Record<"sm" | "md" | "lg", number> = {
  sm: 34,
  md: 44,
  lg: 56,
};

export function Sticker({
  variant,
  rotate = -10,
  size = "md",
  className,
  title,
}: {
  variant: StickerVariant;
  rotate?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
  title?: string;
}) {
  const { bg, fg } = STICKER_STYLE[variant];
  const dim = SIZE_PX[size];
  const iconSize = Math.round(dim * 0.5);

  return (
    <div
      role="img"
      aria-label={title ?? `${variant} sticker`}
      title={title}
      className={cn("pony-sticker pony-pop-in", className)}
      style={{
        width: dim,
        height: dim,
        background: bg,
        color: fg,
        transform: `rotate(${rotate}deg)`,
      }}
    >
      {variant === "star" && <Star size={iconSize} strokeWidth={2.25} fill={fg} />}
      {variant === "heart" && <Heart size={iconSize} strokeWidth={2.25} fill={fg} />}
      {variant === "sparkle" && <Sparkles size={iconSize} strokeWidth={2.25} />}
      {variant === "cloud" && <Cloud size={iconSize} strokeWidth={2.25} />}
      {variant === "rainbow" && <RainbowArc className="w-[70%] h-[70%]" />}
    </div>
  );
}

/** Cycles through a pleasant sticker order so nearby cards don't repeat. */
export const STICKER_CYCLE: StickerVariant[] = ["star", "heart", "sparkle", "rainbow", "cloud"];
