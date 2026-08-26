"use client";

import dynamic from "next/dynamic";
import type { MapPin } from "./CitizenMapClient";

const CitizenMapClientImpl = dynamic(() => import("./CitizenMapClient"), {
  ssr: false,
  loading: () => <div style={{ padding: 24 }}>Loading map…</div>,
});

export default function CitizenMap(props: { pins: MapPin[]; center?: [number, number] }) {
  return <CitizenMapClientImpl {...props} />;
}
