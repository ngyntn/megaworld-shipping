"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Props = {
  page: number;
  pages: number;
  pending?: boolean;
  href?: string | ((page: number) => string);
  onPageChange?: (page: number) => void;
  replace?: boolean;
};

export function Pagination({ page, pages, pending, href, onPageChange, replace }: Props) {
  const total = Math.max(1, pages);
  function control(next: number, label: string, icon: React.ReactNode) {
    const disabled = !!pending || next < 1 || next > total;
    return href && !disabled ? (
      <Link className="pagination-button" href={typeof href === "string" ? `${href}${next}` : href(next)} replace={replace} scroll={false} aria-label={label}>{icon}</Link>
    ) : (
      <button type="button" className="pagination-button" disabled={disabled} aria-label={label} onClick={() => onPageChange?.(next)}>{icon}</button>
    );
  }
  return <nav className="pagination" aria-label="Phân trang">
    {control(page - 1, "Trang trước", <ChevronLeft size={16} />)}
    <span className="pagination-current" aria-current="page">{page}</span>
    <span className="pagination-total">/ {total}</span>
    {control(page + 1, "Trang sau", <ChevronRight size={16} />)}
  </nav>;
}
