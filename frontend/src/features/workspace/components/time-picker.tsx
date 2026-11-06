"use client";
import { useState } from "react";
import { StyledSelect } from "@/components/ui/styled-select";
const pad = (value: number) => String(value).padStart(2, "0");
const hours = Array.from({ length: 24 }, (_, i) => ({ value: pad(i), label: pad(i) }));
const minutes = Array.from({ length: 12 }, (_, i) => ({ value: pad(i * 5), label: pad(i * 5) }));
export function TimePicker({ defaultValue = "" }: { defaultValue?: string }) {
  const [mode, setMode] = useState(defaultValue ? "time" : "all");
  const [hour, setHour] = useState(defaultValue.slice(0, 2) || "09");
  const [minute, setMinute] = useState(defaultValue.slice(3) || "00");
  const choices = minutes.some(m => m.value === minute) ? minutes : [...minutes, { value: minute, label: minute }].sort((a,b) => a.value.localeCompare(b.value));
  return <div className="ws-time-picker">
    <input type="hidden" name="time" value={mode === "all" ? "" : `${hour}:${minute}`} />
    <StyledSelect label="Thời gian" value={mode} onValueChange={setMode} options={[{ value: "all", label: "Cả ngày" }, { value: "time", label: "Chọn giờ" }]} />
    {mode === "time" && <div className="ws-time-parts"><StyledSelect label="Giờ" value={hour} onValueChange={setHour} options={hours} /><span>:</span><StyledSelect label="Phút" value={minute} onValueChange={setMinute} options={choices} /></div>}
  </div>;
}
