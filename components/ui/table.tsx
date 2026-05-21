import * as React from "react";

import { cn } from "@/lib/utils";

interface TableProps extends React.HTMLAttributes<HTMLTableElement> {}

function Table({ className, ...props }: TableProps) {
  return (
    <div className="w-full overflow-x-auto rounded-xl border border-[#1F2937]">
      <table className={cn("w-full text-left text-sm", className)} {...props} />
    </div>
  );
}

function TableHeader({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={cn("sticky top-0 z-10 bg-[#0f172a]", className)} {...props} />;
}

function TableRow({ className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
  return <tr className={cn("border-b border-[#1F2937] odd:bg-black/25 even:bg-[#111827]/60", className)} {...props} />;
}

function TableHead({ className, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn(
        "px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-[#9CA3AF] first:rounded-tl-xl last:rounded-tr-xl",
        className,
      )}
      {...props}
    />
  );
}

function TableCell({ className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn("px-4 py-3 align-middle text-[#E5E7EB]", className)} {...props} />;
}

export { Table, TableHeader, TableHead, TableRow, TableCell };
