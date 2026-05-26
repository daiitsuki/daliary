import { VisitWithPlace } from "../../../../context/PlacesContext";

export interface DetailedKoreaMapProps {
  stats: Record<string, number>;
  subRegionStats: Record<string, Record<string, number>>;
  visits: VisitWithPlace[];
  onRegionSelect: (region: string, subRegion?: string, visitId?: string) => void;
}

export interface MapData {
  detailed: any[];
  provinceOutlines: any[];
}

export interface CurrentStats {
  label: string;
  total: number;
  topName: string;
}
