"use client";
import { useState, useMemo } from "react";
import type { CityData, Metric } from "@/lib/types";
import { METRICS, getMetric } from "@/lib/metrics";

interface Props {
  all: CityData[];
  metric: Metric;
  selected: CityData[];
  isEn: boolean;
  onSelect: (city: CityData) => void;
}

type SortKey = Metric | "name";
type SortDir = "asc" | "desc";

export default function CityTable({ all, metric, selected, isEn, onSelect }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [filter, setFilter] = useState("");

  const selectedNames = useMemo(() => new Set(selected.map((c) => c.name)), [selected]);

  const sorted = useMemo(() => {
    let list = [...all];
    if (filter.trim()) {
      const q = filter.toLowerCase();
      list = list.filter((c) =>
        c.name.toLowerCase().includes(q) ||
        METRICS.some((m) => String(c[m.key]).includes(q))
      );
    }
    list.sort((a, b) => {
      let va: string | number, vb: string | number;
      if (sortKey === "name") {
        va = a.name.toLowerCase();
        vb = b.name.toLowerCase();
      } else {
        va = a[sortKey];
        vb = b[sortKey];
      }
      if (va < vb) return sortDir === "asc" ? -1 : 1;
      if (va > vb) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return list;
  }, [all, sortKey, sortDir, filter]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "name" ? "asc" : "desc");
    }
  };

  const sortIcon = (key: SortKey) => {
    if (sortKey !== key) return "";
    return sortDir === "asc" ? " ↑" : " ↓";
  };

  const columns: { key: SortKey; labelEn: string; labelEs: string }[] = [
    { key: "name", labelEn: "City", labelEs: "Ciudad" },
    ...METRICS.map((m) => ({ key: m.key, labelEn: m.label, labelEs: m.labelEs })),
  ];

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Filter bar */}
      <div className="px-4 py-2 border-b border-slate-200">
        <input
          type="text"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder={isEn ? "Filter cities…" : "Filtrar ciudades…"}
          className="w-full px-3 py-1.5 text-[12px] rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-300 text-slate-700 placeholder-slate-400"
        />
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-[12px]">
          <thead className="sticky top-0 bg-white z-10">
            <tr className="border-b border-slate-200">
              {columns.map((col) => {
                const isActive = col.key === sortKey;
                const isMetric = col.key === metric;
                return (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key)}
                    className={`px-3 py-2 text-left font-medium cursor-pointer select-none whitespace-nowrap transition-colors ${
                      isActive
                        ? "text-indigo-600 bg-indigo-50/50"
                        : isMetric
                          ? "text-indigo-500"
                          : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <span className="text-[11px]">
                      {isEn ? col.labelEn : col.labelEs}
                      {sortIcon(col.key)}
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {sorted.map((city) => {
              const isSel = selectedNames.has(city.name);
              return (
                <tr
                  key={city.name}
                  onClick={() => onSelect(city)}
                  className={`border-b border-slate-100 cursor-pointer transition-colors ${
                    isSel
                      ? "bg-indigo-50 hover:bg-indigo-100"
                      : "hover:bg-slate-50"
                  }`}
                >
                  {columns.map((col) => {
                    if (col.key === "name") {
                      return (
                        <td
                          key={col.key}
                          className={`px-3 py-2 font-medium whitespace-nowrap ${
                            isSel ? "text-indigo-700" : "text-slate-800"
                          }`}
                        >
                          {isSel && (
                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-indigo-500 mr-1.5 align-middle" />
                          )}
                          {city.name}
                        </td>
                      );
                    }
                    const def = getMetric(col.key);
                    const isMetricCol = col.key === metric;
                    return (
                      <td
                        key={col.key}
                        className={`px-3 py-2 tabular-nums whitespace-nowrap ${
                          isMetricCol
                            ? "font-semibold text-slate-800"
                            : "text-slate-500"
                        }`}
                      >
                        {def.format(city[col.key])}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="px-3 py-8 text-center text-slate-400 text-[12px]">
                  {isEn ? "No cities match your filter" : "Sin resultados"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-slate-200 text-[10px] text-slate-400 text-center">
        {sorted.length} {isEn ? "of" : "de"} {all.length} {isEn ? "cities" : "ciudades"}
      </div>
    </div>
  );
}
