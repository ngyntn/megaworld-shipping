import { CalendarCard } from "./calendar-card";
import { NotesCard } from "./notes-card";
import { SavedQuotesCard } from "./saved-quotes-card";

/** Layout only: calendar, saved quotes and personal notes use placeholder data for now. */
export function WorkspaceView() {
  return (
    <div className="op-content">
      <div className="op-title">
        <div>
          <h1>Không gian của tôi</h1>
          <p>Lịch làm việc, báo giá đã lưu và ghi chú cá nhân của bạn</p>
        </div>
      </div>
      <div className="ws-grid">
        <CalendarCard />
        <div className="ws-side">
          <SavedQuotesCard />
          <NotesCard />
        </div>
      </div>
    </div>
  );
}
