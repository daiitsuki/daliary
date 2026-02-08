declare module 'react-simple-maps' {
  import * as React from 'react';

  export interface ComposableMapProps {
    projection?: string | ((...args: any[]) => any);
    projectionConfig?: {
      scale?: number;
      center?: [number, number];
      rotate?: [number, number, number];
      parallels?: [number, number];
    };
    width?: number;
    height?: number;
    style?: React.CSSProperties;
    className?: string;
    children?: React.ReactNode;
  }

  export interface ZoomableGroupProps {
    center?: [number, number];
    zoom?: number;
    minZoom?: number;
    maxZoom?: number;
    onMoveStart?: (event: any, position: any) => void;
    onMoveEnd?: (event: any, position: any) => void;
    onMove?: (position: any) => void;
    translateExtent?: [[number, number], [number, number]];
    filterZoomEvent?: (event: any) => boolean;
    children?: React.ReactNode;
  }

  export interface GeographiesProps {
    geography?: string | object | string[];
    children?: (data: { geographies: any[]; outline: any; borders: any }) => React.ReactNode;
    parseGeographies?: (geos: any[]) => any[];
  }

  export interface GeographyProps {
    geography?: any;
    onMouseEnter?: (event: React.MouseEvent) => void;
    onMouseLeave?: (event: React.MouseEvent) => void;
    onMouseDown?: (event: React.MouseEvent) => void;
    onMouseUp?: (event: React.MouseEvent) => void;
    onClick?: (event: React.MouseEvent) => void;
    style?: {
      default?: React.CSSProperties;
      hover?: React.CSSProperties;
      pressed?: React.CSSProperties;
    };
    className?: string;
  }

  export interface MarkerProps {
    coordinates: [number, number];
    children?: React.ReactNode;
    onMouseEnter?: (event: React.MouseEvent) => void;
    onMouseLeave?: (event: React.MouseEvent) => void;
    onMouseDown?: (event: React.MouseEvent) => void;
    onMouseUp?: (event: React.MouseEvent) => void;
    onClick?: (event: React.MouseEvent) => void;
    style?: {
      default?: React.CSSProperties;
      hover?: React.CSSProperties;
      pressed?: React.CSSProperties;
    };
    className?: string;
  }

  export const ComposableMap: React.FC<ComposableMapProps>;
  export const ZoomableGroup: React.FC<ZoomableGroupProps>;
  export const Geographies: React.FC<GeographiesProps>;
  export const Geography: React.FC<GeographyProps>;
  export const Marker: React.FC<MarkerProps>;
}

declare module 'topojson-client' {
  export function feature(topology: any, object: any): any;
  export function mesh(topology: any, object: any, filter?: (a: any, b: any) => boolean): any;
  export function merge(topology: any, objects: any[]): any;
  export function neighbors(objects: any[]): any[][];
}
