import type { WorkspaceData } from "../types";
import { TagsCard } from "./tags-card";
import { CalendarCard } from "./calendar-card";
import { NotesCard } from "./notes-card";
import { SavedQuotesCard } from "./saved-quotes-card";

export function WorkspaceView({ data }: { data: WorkspaceData }) {
  return (
    <div className="op-content">
      <div className="op-title">
        <div>
          <h1>Không gian của tôi</h1>
          <p>Lịch làm việc, báo giá đã lưu và ghi chú cá nhân của bạn</p>
        </div>
      </div>
      <div className="ws-grid">
        {/* Keyed by month so the selected day resets when navigating months. */}
        <div className="ws-side">
          <CalendarCard key={data.month} month={data.month} today={data.today} events={data.events} tags={data.tags} />
          <TagsCard tags={data.tags} />
        </div>
        <div className="ws-side">
          <SavedQuotesCard quotes={data.quotes} today={data.today} />
          <NotesCard notes={data.notes} tags={data.tags} />
        </div>
      </div>
    </div>
  );
}
