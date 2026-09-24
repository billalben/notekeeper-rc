import { useTranslation } from "react-i18next";
import type { DayActivity } from "../lib/stats";
import { StatCard } from "./StatCard";

const MAX_BAR_HEIGHT = 100;

interface WeekBarProps {
  value: number;
  max: number;
  variant: "created" | "edited";
}

const WeekBar = ({ value, max, variant }: WeekBarProps) => {
  const height =
    value > 0 ? Math.max(6, Math.round((value / max) * MAX_BAR_HEIGHT)) : 0;

  return (
    <div className="week-bar-slot">
      {value > 0 && (
        <span className="week-bar-count text-label-small">{value}</span>
      )}
      <div
        className={`week-bar ${variant}${value === 0 ? " empty" : ""}`}
        style={value > 0 ? { height: `${height}px` } : undefined}
      />
    </div>
  );
};

interface WeekChartProps {
  activity: DayActivity[];
  created: number;
  edited: number;
}

export const WeekChart = ({ activity, created, edited }: WeekChartProps) => {
  const { t, i18n } = useTranslation();

  const maxWeek = Math.max(
    1,
    ...activity.flatMap((day) => [day.created, day.edited]),
  );
  const weekTotal = created + edited;
  const writesLabel =
    weekTotal === 0
      ? t("stats.noWrites")
      : t("stats.writes", { created, edited });
  const chartLabel = t("stats.chartLabel", { created, edited });

  const weekday = new Intl.DateTimeFormat(i18n.language, { weekday: "short" });
  const dayLabel = (day: DayActivity) =>
    day.isToday ? t("stats.today") : weekday.format(day.date);

  return (
    <StatCard span={8} title={t("stats.thisWeek")}>
      <p className="stats-headline text-title-medium">{writesLabel}</p>
      <div className="week-chart" role="img" aria-label={chartLabel}>
        <div className="week-chart-bars" aria-hidden="true">
          {activity.map((day) => (
            <div
              key={day.date}
              className={`week-day${day.isToday ? " today" : ""}`}
            >
              <div className="week-day-bars">
                <WeekBar value={day.created} max={maxWeek} variant="created" />
                <WeekBar value={day.edited} max={maxWeek} variant="edited" />
              </div>
              <span className="week-day-label text-label-small">
                {dayLabel(day)}
              </span>
            </div>
          ))}
        </div>
        <div className="week-legend" aria-hidden="true">
          <span className="week-legend-item text-label-small">
            <span className="week-legend-swatch created" />
            {t("common.created")}
          </span>
          <span className="week-legend-item text-label-small">
            <span className="week-legend-swatch edited" />
            {t("common.edited")}
          </span>
        </div>
      </div>
    </StatCard>
  );
};
