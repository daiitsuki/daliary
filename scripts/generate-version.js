import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const versionData = {
  version: new Date().getTime().toString(), // 현재 타임스탬프를 버전으로 사용
  builtAt: new Date().toISOString()
};

const publicDir = path.resolve(__dirname, '../public');
const versionFilePath = path.join(publicDir, 'version.json');

// public 폴더가 없으면 생성
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir);
}

fs.writeFileSync(versionFilePath, JSON.stringify(versionData, null, 2));

console.log(`✅ Version file generated at ${versionFilePath}`);
console.log(`📦 Build Version: ${versionData.version}`);
