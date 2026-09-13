import { Heart, Sparkle, Star } from "lucide-react";

/**
 * Lop trang tri: tim, sao va lap lanh rai rac tren nen.
 * Nam duoi noi dung, khong bat su kien chuot.
 */
const ITEMS = [
  { Icon: Heart, top: "12%", left: "6%", size: 18, color: "#f9a8d4", delay: "0s", rot: -14 },
  { Icon: Star, top: "22%", left: "88%", size: 16, color: "#d8b4fe", delay: "-1.2s", rot: 12 },
  { Icon: Sparkle, top: "38%", left: "3%", size: 14, color: "#fbcfe8", delay: "-2.4s", rot: 0 },
  { Icon: Heart, top: "58%", left: "93%", size: 15, color: "#fbcfe8", delay: "-0.6s", rot: 18 },
  { Icon: Star, top: "72%", left: "9%", size: 13, color: "#fdba74", delay: "-3s", rot: -8 },
  { Icon: Sparkle, top: "84%", left: "82%", size: 17, color: "#f9a8d4", delay: "-1.8s", rot: 10 },
  { Icon: Heart, top: "46%", left: "50%", size: 12, color: "#fbcfe8", delay: "-2.1s", rot: -6 },
  { Icon: Star, top: "6%", left: "44%", size: 12, color: "#d8b4fe", delay: "-3.4s", rot: 16 },
];

export function Sprinkles() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
      {ITEMS.map((s, i) => (
        <span
          key={i}
          className="sprinkle"
          style={{
            top: s.top,
            left: s.left,
            animationDelay: s.delay,
            transform: `rotate(${s.rot}deg)`,
          }}
        >
          <s.Icon
            size={s.size}
            color={s.color}
            fill={s.color}
            strokeWidth={1.5}
          />
        </span>
      ))}
    </div>
  );
}
