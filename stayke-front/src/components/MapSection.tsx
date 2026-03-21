"use client";

//Library
import L from "leaflet";
import "leaflet/dist/leaflet.css";
//React
import { useEffect, useRef } from "react";
//Own Components
import { properties } from "../constants";

export const MapSection = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<unknown>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    import("leaflet").then((L) => {
      const map = L.map(mapRef.current!, {
        center: [20, 0],
        zoom: 2,
        zoomControl: false,
        attributionControl: false,
      });

      L.control.zoom({ position: "bottomright" }).addTo(map);

      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
        { maxZoom: 19 }
      ).addTo(map);

      const customIcon = L.divIcon({
        className: "custom-marker",
        html: `<div style="
          width: 32px; height: 32px;
          background: linear-gradient(135deg, hsl(174 90% 50%), hsl(260 60% 55%));
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 0 15px hsl(174 90% 50% / 0.4);
        ">
          <div style="transform: rotate(45deg); color: hsl(220 20% 6%); font-weight: bold; font-size: 14px;">$</div>
        </div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32],
      });

      properties.forEach((prop) => {
        L.marker([prop.lat, prop.lng], { icon: customIcon }).addTo(map)
          .bindPopup(`
            <div style="font-family: sans-serif; padding: 4px;">
              <strong style="font-size: 14px;">${prop.title}</strong><br/>
              <span style="color: #666; font-size: 12px;">${prop.location}</span><br/>
              <span style="color: hsl(174 90% 40%); font-weight: bold; font-size: 14px;">$${prop.price} USD</span>
              <span style="color: #999; font-size: 11px;"> / night</span>
            </div>
          `);
      });

      mapInstance.current = map;
    });

    return () => {
      if (mapInstance.current) {
        (mapInstance.current as L.Map).remove();
        mapInstance.current = null;
      }
    };
  }, []);

  return (
    <div className="overflow-hidden rounded-2xl border border-border shadow-card">
      <div ref={mapRef} className="h-150 lg:h-187.5 w-full" />
    </div>
  );
};
