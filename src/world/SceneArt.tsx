import { COTTAGE, SCENE_HEIGHT, SCENE_WIDTH } from './sceneLayout'

const asset = (name: string) => `${import.meta.env.BASE_URL}world/${name}.webp`

export function LandscapeLayer() {
  return <image href={asset('valley')} width={SCENE_WIDTH} height={SCENE_HEIGHT} />
}

export function CentralCottage() {
  return (
    <g transform={`translate(${COTTAGE.x} ${COTTAGE.y})`}>
      <ellipse cx="23" cy="-11" rx="151" ry="33" fill="#29381a" opacity=".18" />
      <image href={asset('cottage')} x="-154" y="-282" width="308" height="282" />
    </g>
  )
}

export function Wildflowers({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <path d="m2 0-4-13M5 0l4-18m3 18 5-9m-17 9-8-5" fill="none" stroke="#687d31" strokeWidth="2" />
      <circle cx="-3" cy="-13" r="3.2" fill="#f6ce83" />
      <circle cx="9" cy="-18" r="3.5" fill="#f5d8d8" />
      <circle cx="17" cy="-9" r="2.8" fill="#dec9e7" />
      <circle cx="-8" cy="-5" r="2.6" fill="#fff0c0" />
    </g>
  )
}

export function SharedWorldDetails({ lantern, garden }: { lantern: boolean; garden: boolean }) {
  return (
    <>
      {lantern && (
        <g transform="translate(1001 620)">
          <path d="M0 0v-45l11-8 13 1v8" fill="none" stroke="#544629" strokeWidth="5" />
          <circle cx="23" cy="-36" r="22" fill="#ffe09a" opacity=".2" />
          <path d="m14-43 4 14h11l4-14-9-5z" fill="#fbd780" stroke="#564b33" strokeWidth="3" />
          <path d="M-33 4q-26 4-54 14m130-31 28-11" fill="none" stroke="#dfc39a" strokeWidth="7" strokeLinecap="round" strokeDasharray="4 11" />
        </g>
      )}
      {garden && (
        <g transform="translate(903 559)">
          <ellipse cx="0" cy="3" rx="67" ry="20" fill="#715e3f" opacity=".74" />
          <path d="M-59 8Q-20 32 56 9" stroke="#c5b994" strokeWidth="6" fill="none" strokeDasharray="13 2" />
          {[-49, -31, -13, 5, 22, 40].map((x, index) => (
            <Wildflowers key={x} x={x} y={index % 2 === 0 ? 2 : 13} scale={1.05} />
          ))}
          <path d="m14-29 51 7-5 10-47-6zM19-19v10m35-6v11" fill="#987347" stroke="#654c32" strokeWidth="4" strokeLinejoin="round" />
        </g>
      )}
    </>
  )
}

export function AmbientEffects() {
  return (
    <>
      <g className="scene-cloud" fill="#fdedcf" opacity=".24" transform="translate(773 17)">
        <path d="M0 44q-7-8 13-10 5-12 26-8 22-25 50-5 36-5 43 12 23 2 25 9z" />
      </g>
      <g className="scene-smoke" fill="#f6e4c5" transform="translate(811 288)">
        <ellipse cx="1" cy="-8" rx="9" ry="6" opacity=".44" />
        <ellipse cx="10" cy="-23" rx="14" ry="8" opacity=".3" />
        <ellipse cx="26" cy="-42" rx="19" ry="9" opacity=".18" />
      </g>
      <g className="scene-water" stroke="#f8efc6" strokeWidth="2.6" strokeLinecap="round" fill="none" opacity=".55">
        <path d="M1168 733q29-7 54-4m35 80q31 1 50 14m32 91 49 13m29 41 37 8" />
      </g>
      <g className="scene-birds" transform="translate(927 154)" fill="none" stroke="#465952" strokeWidth="2.2" strokeLinecap="round">
        <path d="M0 5q6-5 10 1 4-7 10-4m17 7q5-4 9 1 3-7 8-4m-24 21q5-4 9 1 3-6 8-4" />
      </g>
      <g className="scene-fern" fill="none" stroke="#a3ad57" strokeWidth="3" strokeLinecap="round">
        <path d="M1110 943q-4-23-22-35m18 23-18-7m14-1 2-12m-8 5-10-2m-51-48q-4-23-22-35m18 23-18-7" />
      </g>
    </>
  )
}
