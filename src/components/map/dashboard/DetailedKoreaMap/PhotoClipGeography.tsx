import React, { memo, useId, useMemo } from 'react';
import { useMapContext } from 'react-simple-maps';

interface PhotoClipGeographyProps {
  geo: any;
  photoUrl: string;
  isDeactivated: boolean;
  onClick: () => void;
}

const PhotoClipGeography: React.FC<PhotoClipGeographyProps> = ({
  geo,
  photoUrl,
  isDeactivated,
  onClick,
}) => {
  const { path: geoPath } = useMapContext();
  const instanceId = useId();

  const result = useMemo(() => {
    const d = geoPath(geo) ?? '';
    const [[x0, y0], [x1, y1]] = geoPath.bounds(geo);
    const bw = x1 - x0;
    const bh = y1 - y0;
    if (!isFinite(bw) || !isFinite(bh) || bw <= 0 || bh <= 0) return null;
    return { pathD: d, x: x0, y: y0, w: bw, h: bh };
  }, [geo, geoPath]);

  if (!result) return null;

  const { pathD, x, y, w, h } = result;
  // instanceId는 React 내부에서 유일하게 생성되므로 DOM 전역 충돌 없음
  const clipId = `clip-${instanceId}-${geo.rsmKey}`.replace(/:/g, '-');

  return (
    <g
      onClick={onClick}
      style={{
        cursor: isDeactivated ? 'default' : 'pointer',
        opacity: isDeactivated ? 0.2 : 1,
        transition: 'opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      <defs>
        <clipPath id={clipId}>
          <path d={pathD} />
        </clipPath>
      </defs>
      {/* 배경 (사진 로딩 전 표시) */}
      <path d={pathD} fill="#f9fafb" stroke="#d1d5db" strokeWidth={0.4} />
      {/* 사진 — preserveAspectRatio="xMidYMid slice"가 object-fit:cover 역할 */}
      <image
        href={photoUrl}
        x={x}
        y={y}
        width={w}
        height={h}
        clipPath={`url(#${clipId})`}
        preserveAspectRatio="xMidYMid slice"
      />
      {/* 테두리 + 클릭 영역 */}
      <path d={pathD} fill="transparent" stroke="#d1d5db" strokeWidth={0.4} />
    </g>
  );
};

export default memo(PhotoClipGeography);
