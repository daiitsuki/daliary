const fs = require('fs');
const path = require('path');
const { merge } = require('topojson-client');
const { simplify, presimplify } = require('topojson-simplify');
const { geoCentroid } = require('d3-geo');

const fetch = globalThis.fetch || require('node-fetch');

const TOPOJSON_URL = "https://raw.githubusercontent.com/southkorea/southkorea-maps/master/kostat/2018/json/skorea-municipalities-2018-topo.json";

const CODE_TO_PROVINCE = {
  "11": "서울", "21": "부산", "22": "대구", "23": "인천",
  "24": "광주", "25": "대전", "26": "울산", "29": "세종",
  "31": "경기", "32": "강원", "33": "충북", "34": "충남",
  "35": "전북", "36": "전남", "37": "경북", "38": "경남", "39": "제주",
};

const METRO_CODES = ["11", "21", "22", "23", "24", "25", "26", "29"];

async function generate() {
  console.log("Fetching TopoJSON data...");
  const response = await fetch(TOPOJSON_URL);
  let topoData = await response.json();

  console.log("Simplifying geography (Reducing points)...");
  topoData = presimplify(topoData);
  topoData = simplify(topoData, 0.0001); 

  const objectName = "skorea_municipalities_2018_geo";
  const geometries = topoData.objects[objectName].geometries;

  console.log("Processing and Merging geometries...");
  const detailedGroups = {};
  const provinceGroups = {};

  geometries.forEach((g) => {
    const codePrefix = g.properties.code.substring(0, 2);
    const province = CODE_TO_PROVINCE[codePrefix] || "기타";
    const isMetro = METRO_CODES.includes(codePrefix);

    let detailedKey;
    if (isMetro) {
      detailedKey = province;
    } else {
      const fullName = g.properties.name;
      const match = fullName.match(/^(.+?[시군])/);
      const siGunName = match ? match[1] : fullName;
      detailedKey = `${province}_${siGunName}`;
    }

    if (!detailedGroups[detailedKey]) {
      detailedGroups[detailedKey] = {
        geoms: [],
        province,
        code: g.properties.code,
        isMetro,
      };
    }
    detailedGroups[detailedKey].geoms.push(g);

    if (!provinceGroups[province]) {
      provinceGroups[province] = { geoms: [] };
    }
    provinceGroups[province].geoms.push(g);
  });

  const roundCoord = (c) => [Math.round(c[0] * 10000) / 10000, Math.round(c[1] * 10000) / 10000];

  const detailed = Object.entries(detailedGroups).map(([key, data]) => {
    const province = data.province;
    const name = key.includes("_") ? key.split("_")[1] : province;
    const mergedGeom = merge(topoData, data.geoms);
    
    const feature = {
      type: "Feature",
      properties: { name, province, isMetro: data.isMetro },
      geometry: mergedGeom,
    };

    let labelCoord = null;
    try {
      const centroid = geoCentroid(feature);
      if (!isNaN(centroid[0]) && !isNaN(centroid[1])) {
        labelCoord = roundCoord(centroid);
      }
    } catch (e) {}

    if (feature.geometry.type === "Polygon") {
      feature.geometry.coordinates = feature.geometry.coordinates.map(ring => ring.map(roundCoord));
    } else if (feature.geometry.type === "MultiPolygon") {
      feature.geometry.coordinates = feature.geometry.coordinates.map(polygon => 
        polygon.map(ring => ring.map(roundCoord))
      );
    }

    return { ...feature, labelCoord };
  });

  const provinceOutlines = Object.entries(provinceGroups).map(([name, data]) => {
    const mergedGeom = merge(topoData, data.geoms);
    
    if (mergedGeom.type === "Polygon") {
      mergedGeom.coordinates = mergedGeom.coordinates.map(ring => ring.map(roundCoord));
    } else if (mergedGeom.type === "MultiPolygon") {
      mergedGeom.coordinates = mergedGeom.coordinates.map(polygon => 
        polygon.map(ring => ring.map(roundCoord))
      );
    }

    return {
      type: "Feature",
      properties: { name },
      geometry: mergedGeom,
    };
  });

  const output = { detailed, provinceOutlines };
  const outputPath = path.join(__dirname, '../public/data/optimized-korea-map.json');
  
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(output));
  
  const stats = fs.statSync(outputPath);
  console.log(`Successfully generated optimized map data at ${outputPath}`);
  console.log(`Final File Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
}

generate().catch(console.error);
