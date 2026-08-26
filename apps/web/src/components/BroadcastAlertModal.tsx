"use client";

import { useState } from "react";
import Modal from "./Modal";
import type { Alert } from "@/lib/useDashboardData";

interface Props {
  onClose: () => void;
  onBroadcast: (alert: {
    disaster_type: string;
    severity_color: Alert["severity_color"];
    area_description: string;
    warning_message: string;
    lat: number;
    lng: number;
  }) => void;
}

const DEFAULT_CENTER = { lat: 13.0674, lng: 80.2376 };

export default function BroadcastAlertModal({ onClose, onBroadcast }: Props) {
  const [disasterType, setDisasterType] = useState("");
  const [severity, setSeverity] = useState<Alert["severity_color"]>("orange");
  const [area, setArea] = useState("");
  const [message, setMessage] = useState("");
  const [lat, setLat] = useState(DEFAULT_CENTER.lat);
  const [lng, setLng] = useState(DEFAULT_CENTER.lng);

  function handleSubmit() {
    if (!disasterType.trim() || !message.trim()) return;
    onBroadcast({
      disaster_type: disasterType.trim(),
      severity_color: severity,
      area_description: area.trim(),
      warning_message: message.trim(),
      lat,
      lng,
    });
    onClose();
  }

  return (
    <Modal title="Broadcast Custom Advisory" onClose={onClose}>
      <div className="flex flex-col gap-2.5">
        <p className="text-xs text-text-muted">
          Authority-authored advisory — appears on the map and citizen views alongside automated SACHET alerts.
        </p>
        <input
          value={disasterType}
          onChange={(e) => setDisasterType(e.target.value)}
          placeholder="Disaster type (e.g. Flash Flood)"
          className="bg-panel-alt border border-border rounded px-2.5 py-2 text-sm outline-none"
        />
        <input
          value={area}
          onChange={(e) => setArea(e.target.value)}
          placeholder="Area description (e.g. Adyar riverbank, Chennai)"
          className="bg-panel-alt border border-border rounded px-2.5 py-2 text-sm outline-none"
        />
        <select
          value={severity}
          onChange={(e) => setSeverity(e.target.value as Alert["severity_color"])}
          className="bg-panel-alt border border-border rounded px-2.5 py-2 text-sm outline-none"
        >
          <option value="yellow">Yellow</option>
          <option value="orange">Orange</option>
          <option value="red">Red</option>
        </select>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Advisory message"
          rows={3}
          className="bg-panel-alt border border-border rounded px-2.5 py-2 text-sm outline-none resize-none"
        />
        <div className="flex gap-2">
          <input
            type="number"
            step="0.0001"
            value={lat}
            onChange={(e) => setLat(Number(e.target.value))}
            className="flex-1 bg-panel-alt border border-border rounded px-2.5 py-2 text-sm outline-none font-mono"
          />
          <input
            type="number"
            step="0.0001"
            value={lng}
            onChange={(e) => setLng(Number(e.target.value))}
            className="flex-1 bg-panel-alt border border-border rounded px-2.5 py-2 text-sm outline-none font-mono"
          />
        </div>
        <button
          onClick={handleSubmit}
          disabled={!disasterType.trim() || !message.trim()}
          className="py-2.5 rounded text-sm font-bold uppercase disabled:opacity-40 cursor-pointer"
          style={{ background: "var(--accent)", color: "var(--accent-contrast)" }}
        >
          Broadcast
        </button>
      </div>
    </Modal>
  );
}
