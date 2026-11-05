/** Placeholder content for the workspace layout. Replace with real data when the features are built. */
export const sampleEvents = [
  { day: 3, tone: "blue" },
  { day: 8, tone: "green" },
  { day: 12, tone: "amber" },
  { day: 12, tone: "blue" },
  { day: 19, tone: "green" },
  { day: 26, tone: "amber" },
] as const;

export const sampleUpcoming = [
  { time: "09:00", title: "Gọi khách ABC Logistics chốt giá Cát Lái → Los Angeles", tag: "Khách hàng", tone: "blue" },
  { time: "14:30", title: "Cập nhật bảng giá tuyến châu Âu", tag: "Giá cước", tone: "green" },
  { time: "16:00", title: "Kiểm tra cut-off chuyến EVER ACE", tag: "Lịch tàu", tone: "amber" },
] as const;

export const sampleQuotes = [
  { route: "Cát Lái → Los Angeles", carrier: "ONE", container: "40HC", price: "2.800 $", valid: "Đến 30/11", saved: "Hôm nay" },
  { route: "Cái Mép → Rotterdam", carrier: "CMA CGM", container: "40HC", price: "3.390 $", valid: "Đến 15/12", saved: "Hôm qua" },
  { route: "Hải Phòng → Busan", carrier: "KMTC", container: "20GP", price: "280 $", valid: "Đến 30/11", saved: "03/11" },
] as const;

export const sampleNotes = [
  { title: "Khách cần báo giá gấp", body: "Công ty ABC hỏi 3 tuyến Mỹ, cần trước thứ Sáu.", tone: "yellow" },
  { title: "Nhắc việc", body: "Gửi lại lịch tàu tuần sau cho nhóm sales.", tone: "blue" },
  { title: "Ghi chú tuyến EU", body: "Phụ phí mùa cao điểm áp dụng từ 01/12.", tone: "green" },
] as const;
