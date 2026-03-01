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
