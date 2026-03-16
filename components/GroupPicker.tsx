"use client";

import { useState } from "react";
import { Group, Team } from "@/lib/tournament";
import { GripVertical, ChevronUp, ChevronDown } from "lucide-react";
import { REGION_COLORS } from "@/lib/tournament";

interface GroupPickerProps {
  group: Group;
  ranking: string[]; // team ids in order
  onChange: (groupId: string, ranking: string[]) => void;
}

export default function GroupPicker({ group, ranking, onChange }: GroupPickerProps) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const orderedTeams: Team[] = ranking.map(
    (id) => group.teams.find((t) => t.id === id)!
  );

  const moveTeam = (fromIdx: number, toIdx: number) => {
    const newRanking = [...ranking];
    const [removed] = newRanking.splice(fromIdx, 1);
    newRanking.splice(toIdx, 0, removed);
    onChange(group.id, newRanking);
  };

  const handleDragStart = (e: React.DragEvent, idx: number) => {
    setDragIndex(idx);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverIndex(idx);
  };

  const handleDrop = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (dragIndex !== null && dragIndex !== idx) {
      moveTeam(dragIndex, idx);
    }
    setDragIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDragIndex(null);
    setDragOverIndex(null);
  };

  const rankLabels = ["1st", "2nd", "3rd", "4th"];
  const rankColors = ["#C8AA6E", "#A0B4C5", "#785A28", "#3D5A6F"];
  const qualifies = [true, true, false, false]; // top 2 advance

  return (
    <div className="lol-panel rounded-sm p-4">
      {/* Group header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-1 h-6 bg-[#C8AA6E] rounded-full" />
        <h3 className="text-[#C8AA6E] font-black tracking-widest text-sm uppercase">
          {group.name}
        </h3>
        <div className="flex-1 h-px bg-[#1E2D3D]" />
        <span className="text-[#3D5A6F] text-xs tracking-wider">Drag to rank</span>
      </div>

      {/* Teams */}
      <div className="space-y-2">
        {orderedTeams.map((team, idx) => {
          const regionColor = REGION_COLORS[team.region];
          const isDragging = dragIndex === idx;
          const isDragOver = dragOverIndex === idx;

          return (
            <div
              key={team.id}
              draggable
              onDragStart={(e) => handleDragStart(e, idx)}
              onDragOver={(e) => handleDragOver(e, idx)}
              onDrop={(e) => handleDrop(e, idx)}
              onDragEnd={handleDragEnd}
              className={`
                flex items-center gap-3 p-3 rounded-sm border transition-all cursor-grab active:cursor-grabbing
                ${isDragging ? "opacity-40 scale-95" : ""}
                ${isDragOver && !isDragging ? "border-[#0BC4E3] bg-[#0BC4E3]/5" : ""}
                ${qualifies[idx] ? "border-[#1E2D3D] bg-[#0A1428]" : "border-[#1E2D3D]/50 bg-[#0A1428]/30"}
              `}
            >
              {/* Rank badge */}
              <div className="flex flex-col items-center w-8">
                <span className="text-xs font-black" style={{ color: rankColors[idx] }}>
                  {rankLabels[idx]}
                </span>
                {qualifies[idx] && (
                  <div className="w-1.5 h-1.5 rounded-full mt-0.5" style={{ backgroundColor: "#00C050" }} />
                )}
              </div>

              {/* Drag handle */}
              <GripVertical className="w-4 h-4 text-[#1E2D3D]" />

              {/* Team logo */}
              <div
                className="w-9 h-9 hex-clip flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${team.logoColor}22` }}
              >
                <span className="text-xs font-black" style={{ color: team.logoColor }}>
                  {team.shortName.slice(0, 3)}
                </span>
              </div>

              {/* Team info */}
              <div className="flex-1 min-w-0">
                <div className="text-[#F0E6D3] font-bold text-sm truncate">{team.name}</div>
                <div className="text-xs font-semibold" style={{ color: regionColor }}>{team.region}</div>
              </div>

              {/* Up/down buttons */}
              <div className="flex flex-col gap-0.5">
                <button
                  onClick={() => idx > 0 && moveTeam(idx, idx - 1)}
                  disabled={idx === 0}
                  className="text-[#3D5A6F] hover:text-[#C8AA6E] disabled:opacity-20 transition-colors"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
                <button
                  onClick={() => idx < orderedTeams.length - 1 && moveTeam(idx, idx + 1)}
                  disabled={idx === orderedTeams.length - 1}
                  className="text-[#3D5A6F] hover:text-[#C8AA6E] disabled:opacity-20 transition-colors"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Advance line */}
      <div className="mt-3 flex items-center gap-2">
        <div className="flex-1 h-px bg-[#00C050]/30 border-t border-dashed border-[#00C050]/30" />
        <span className="text-[#00C050] text-xs tracking-wider">TOP 2 ADVANCE</span>
        <div className="flex-1 h-px bg-[#00C050]/30" />
      </div>
    </div>
  );
}
