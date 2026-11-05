import Form from "next/form";
import { Search } from "lucide-react";
export function AdminHeader({
  name,
  query = "",
}: {
  name: string;
  query?: string;
}) {
  return (
    <header className="admin-header">
      <Form className="header-search" action="/admin/rates">
        <Search size={18} />
        <input
          name="q"
          type="search"
          aria-label="Tìm kiếm"
          placeholder="Tìm theo POL, POD, hãng tàu…"
          defaultValue={query}
        />
      </Form>
      <div className="staff-profile">
        <span className="avatar">
          {name
            .split(/\s+/)
            .slice(-2)
            .map((s) => s[0])
            .join("")
            .toUpperCase()}
        </span>
        <span>
          <b>{name}</b>
          <small>Admin</small>
        </span>
      </div>
    </header>
  );
}
