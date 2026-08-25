"use client";

import { useState } from "react";
import Modal from "./Modal";
import type { Resource } from "@/lib/useDashboardData";

interface Props {
  resources: Resource[];
  onClose: () => void;
  onAdd: (resource: Omit<Resource, "id">) => void;
  onUpdate: (id: string, updates: Partial<Omit<Resource, "id">>) => void;
}

const DEFAULT_CENTER = { lat: 13.0674, lng: 80.2376 };

export default function ManageResourcesModal({ resources, onClose, onAdd, onUpdate }: Props) {
  const [name, setName] = useState("");
  const [type, setType] = useState<Resource["type"]>("shelter");
  const [capacity, setCapacity] = useState(50);

  function handleAdd() {
    if (!name.trim()) return;
    onAdd({ name: name.trim(), type, capacity, status: "available", ...DEFAULT_CENTER });
    setName("");
    setCapacity(50);
  }

  return (
    <Modal title="Manage Resources" onClose={onClose}>
      <div className="flex flex-col gap-3">
        <div className="bg-panel-alt rounded-md p-3 flex flex-col gap-2.5">
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-text-muted">
            Add New Resource
          </span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name (e.g. Anna Nagar Relief Camp)"
            className="bg-panel border border-border rounded px-2.5 py-2 text-sm outline-none"
          />
          <div className="flex gap-2">
            <select
              value={type}
              onChange={(e) => setType(e.target.value as Resource["type"])}
              className="flex-1 bg-panel border border-border rounded px-2.5 py-2 text-sm outline-none"
            >
              <option value="shelter">Shelter</option>
              <option value="rescue_team">Rescue Team</option>
              <option value="supply_stock">Supply Stock</option>
            </select>
            <input
              type="number"
              value={capacity}
              onChange={(e) => setCapacity(Number(e.target.value))}
              className="w-24 bg-panel border border-border rounded px-2.5 py-2 text-sm outline-none"
            />
          </div>
          <p className="text-xs text-text-muted">
            New resources are placed at the demo region center — drag isn&apos;t wired up yet, edit lat/lng via the list below if needed.
          </p>
          <button
            onClick={handleAdd}
            disabled={!name.trim()}
            className="py-2 rounded text-xs font-bold uppercase disabled:opacity-40 cursor-pointer"
            style={{ background: "var(--accent)", color: "var(--accent-contrast)" }}
          >
            Add Resource
          </button>
        </div>

        <div className="flex flex-col gap-1.5 max-h-64 overflow-y-auto">
          {resources.map((r) => (
            <div key={r.id} className="flex items-center justify-between gap-2 bg-panel-alt rounded p-2.5 text-sm">
              <div className="min-w-0">
                <div className="font-semibold truncate">{r.name}</div>
                <div className="font-mono text-xs text-text-muted">{r.type.replace("_", " ")} · cap {r.capacity}</div>
              </div>
              <select
                value={r.status}
                onChange={(e) => onUpdate(r.id, { status: e.target.value as Resource["status"] })}
                className="font-mono text-xs bg-panel border border-border rounded px-1.5 py-1 outline-none shrink-0"
              >
                <option value="available">available</option>
                <option value="full">full</option>
                <option value="dispatched">dispatched</option>
              </select>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
}
