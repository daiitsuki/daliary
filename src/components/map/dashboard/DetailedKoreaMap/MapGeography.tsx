import React, { memo } from "react";
import { Geography } from "react-simple-maps";

interface MapGeographyProps {
  geo: any;
  onClick: () => void;
  fillColor: string;
  isDeactivated: boolean;
}

const MapGeography: React.FC<MapGeographyProps> = ({
  geo,
  onClick,
  fillColor,
  isDeactivated,
}) => {
  return (
    <Geography
      geography={geo}
      onClick={onClick}
      style={{
        default: {
          fill: isDeactivated ? "#f3f4f6" : fillColor,
          fillOpacity: isDeactivated ? 0.2 : 1,
          stroke: isDeactivated ? "#e5e7eb" : "#d1d5db",
          strokeWidth: 0.4,
          outline: "none",
          transition: "all 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
        },
        hover: {
          fill: isDeactivated ? "#f3f4f6" : fillColor,
          fillOpacity: isDeactivated ? 0.2 : 1,
          stroke: isDeactivated ? "#e5e7eb" : "#d1d5db",
          strokeWidth: 0.4,
          outline: "none",
          cursor: isDeactivated ? "default" : "pointer",
        },
        pressed: {
          fill: "#fb7185",
          outline: "none",
        },
      }}
    />
  );
};

export default memo(MapGeography);
