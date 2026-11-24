"use client";

import { useId } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SORT_OPTIONS, type SortOption } from "@/lib/video-query";

interface SortSelectProps {
  value: SortOption;
  onChange: (value: SortOption) => void;
}

export function SortSelect({ value, onChange }: SortSelectProps) {
  const labelId = useId();
  return (
    <div className="flex items-center gap-3">
      <span id={labelId} className="eyebrow shrink-0 text-muted-foreground">
        Sắp xếp
      </span>
      <Select value={value} onValueChange={(next) => onChange(next as SortOption)}>
        <SelectTrigger aria-labelledby={labelId} className="w-36">
          <SelectValue />
        </SelectTrigger>
        <SelectContent position="popper" align="end">
          {SORT_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
