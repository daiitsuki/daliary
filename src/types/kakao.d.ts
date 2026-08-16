declare global {
  interface Window {
    kakao: any;
  }
  namespace kakao {
    namespace maps {
      class Map {
        constructor(container: HTMLElement, options: any);
        panTo(latlng: LatLng): void;
        setCenter(latlng: LatLng): void;
        getCenter(): LatLng;
        relayout(): void;
        setBounds(bounds: LatLngBounds, paddingTop?: number, paddingRight?: number, paddingBottom?: number, paddingLeft?: number): void;
        getBounds(): LatLngBounds;
        setLevel(level: number, options?: any): void;
        getLevel(): number;
        getProjection(): MapProjection;
      }
      class Point {
        constructor(x: number, y: number);
        x: number;
        y: number;
      }
      interface MapProjection {
        pointFromCoords(latlng: LatLng): Point;
        coordsFromPoint(point: Point): LatLng;
      }
      class LatLngBounds {
        constructor();
        extend(latlng: LatLng): void;
        getSouthWest(): LatLng;
        getNorthEast(): LatLng;
      }
      class LatLng {
        constructor(lat: number, lng: number);
        getLat(): number;
        getLng(): number;
      }
      namespace services {
        class Places {
          keywordSearch(keyword: string, callback: (data: any, status: Status) => void, options?: any): void;
        }
        enum Status {
          OK,
          ZERO_RESULT,
          ERROR
        }
      }
      namespace event {
        function addListener(target: any, type: string, callback: Function): void;
      }
    }
  }
}

export {};
