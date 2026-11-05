import { Search } from "lucide-react";
export function ModuleHeader({
  name,
  placeholder,
  onSearch,
}: {
  name: string;
  placeholder?: string;
  onSearch?: (q: string) => void;
}) {
  return (
    <header className="admin-header">
      {placeholder ? (
        <label className="header-search">
          <Search size={18} />
          <input
            type="search"
            aria-label="Tìm kiếm"
            placeholder={placeholder}
            onChange={(e) => onSearch?.(e.target.value)}
          />
        </label>
      ) : (
        <div style={{ flex: 1 }} />
      )}
      <div className="staff-profile">
        <span className="avatar">
          {name
            .split(" ")
            .filter(Boolean)
            .slice(-2)
            .map((n) => n[0])
            .join("")}
        </span>
        <span>
          <b>{name}</b>
          <small>Admin</small>
        </span>
      </div>
    </header>
  );
}
export function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="op-field">
      <span>{label}</span>
      {children}
    </label>
  );
}
export function Message({
  error,
  success,
}: {
  error?: string;
  success?: string;
}) {
  return error ? (
    <p role="alert" className="error-message">
      {error}
    </p>
  ) : success ? (
    <p role="status" className="op-success">
      {success}
    </p>
  ) : null;
}
