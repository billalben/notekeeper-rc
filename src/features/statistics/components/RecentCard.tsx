import { useTranslation } from "react-i18next";
import { useRelativeTime } from "@/shared/hooks/useRelativeTime";
import type { Note } from "@/shared/types";
import { notePreview } from "../lib/format";
import { StatCard } from "./StatCard";

interface RecentItem {
  tag: string;
  note: Note | null;
  time?: number;
}

interface RecentCardProps {
  recent: RecentItem[];
  notebookNames: Record<string, string>;
  onOpenNote: (note: Note) => void;
}

export const RecentCard = ({
  recent,
  notebookNames,
  onOpenNote,
}: RecentCardProps) => {
  const { t } = useTranslation();
  const relativeTime = useRelativeTime();

  return (
    <StatCard span={12} title={t("stats.pickUp")}>
      <div className="stats-recent">
        {recent.map((item) => {
          const notebookName = item.note
            ? notebookNames[item.note.notebookId]
            : undefined;
          const preview = item.note ? notePreview(item.note) : "";

          return (
            <button
              key={item.tag}
              type="button"
              className="recent-item"
              disabled={!item.note}
              onClick={() => {
                if (item.note) onOpenNote(item.note);
              }}
            >
              <span className="recent-item-title text-title-small">
                {item.note
                  ? item.note.title.trim() || t("common.untitled")
                  : t("stats.noNotesYet")}
              </span>
              <span className="recent-item-preview text-body-small">
                {preview || notebookName || "—"}
              </span>
              <span className="recent-item-meta">
                <span className="recent-tag text-label-small">{item.tag}</span>
                {item.note && item.time && (
                  <span className="recent-time text-body-small">
                    {relativeTime(item.time)}
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>
    </StatCard>
  );
};
