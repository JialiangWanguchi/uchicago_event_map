"use client";

import { createElement } from "react";
import "leaflet/dist/leaflet.css";
import { MapContainer, Marker, TileLayer } from "react-leaflet";
import L from "leaflet";
import type { EventRecord } from "@/types/event";

const pinIcon = L.divIcon({
  html: '<div style="background-color: #2f6fed; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white; box-shadow: 0 1px 3px rgba(0,0,0,0.3);"></div>',
  className: "",
  iconSize: [16, 16],
  iconAnchor: [8, 8]
});

export default function EventDetailMapClient({ event }: { event: EventRecord }) {
  const position: [number, number] = [event.latitude!, event.longitude!];

  return createElement(
    "div",
    { className: "h-56 w-full" },
    createElement(
      MapContainer,
      { center: position, zoom: 17, scrollWheelZoom: false, className: "h-full w-full" },
      createElement(TileLayer, {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      }),
      createElement(Marker, { position, icon: pinIcon })
    )
  );
}
