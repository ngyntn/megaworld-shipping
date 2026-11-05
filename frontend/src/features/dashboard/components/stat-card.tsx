import type { LucideIcon } from "lucide-react";
import { StatDecor, type StatTone } from "./stat-decor";

type Props = {
  value: number;
  label: string;
  icon: LucideIcon;
  tone: StatTone;
  /** Small pill under the label, e.g. "7 ngày gần đây". */
  chip?: string;
};

/** Dashboard KPI card: tinted icon tile · divider · number + label · decorative art. */
export function StatCard({ value, label, icon: Icon, tone, chip }: Props) {
  return (
    <div className={`stat-card stat-${tone}`}>
      <span className="stat-icon">
        <Icon size={26} strokeWidth={2} />
      </span>
      <span className="stat-divider" aria-hidden />
      <div className="stat-text">
        <div className="stat-number">{value.toLocaleString("vi-VN")}</div>
        <div className="stat-label">{label}</div>
        {chip && <span className="stat-chip">{chip}</span>}
      </div>
      <StatDecor tone={tone} />
    </div>
  );
}
