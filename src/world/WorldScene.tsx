import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { Icon } from '../components/Icon'
import type { ArchetypeId } from '../domain/progressionConfig'
import type { BuildingVitality } from '../domain/world'
import { Building, ConstructionZone, VitalityEffects } from './Building'
import { AmbientEffects, CentralCottage, LandscapeLayer, SharedWorldDetails } from './SceneArt'
import { COTTAGE, SCENE_HEIGHT, SCENE_WIDTH, scenePosition, SITE_LAYOUT } from './sceneLayout'
import { WorldCamera } from './WorldCamera'
import { WorldMessage } from './WorldMessage'
import { WorldViewport } from './WorldViewport'

export interface SceneSite {
  id: string
  title: string
  stage: number
  stageName: string
  vitality: BuildingVitality
  archetype: ArchetypeId
  detail: string
}

export function WorldScene({ sites, lantern, garden, message, dismiss, welcome }: {
  sites: readonly SceneSite[]
  lantern: boolean
  garden: boolean
  message: string | undefined
  dismiss: () => void
  welcome: boolean
}) {
  const [selected, setSelected] = useState<string | null>(null)
  const [hidden, setHidden] = useState(() => document.hidden)

  useEffect(() => {
    const update = () => setHidden(document.hidden)
    document.addEventListener('visibilitychange', update)
    return () => document.removeEventListener('visibilitychange', update)
  }, [])

  const positioned = sites.flatMap((site) => {
    const placement = SITE_LAYOUT[site.id]
    return placement ? [{ ...site, ...placement }] : []
  }).sort((a, b) => a.y - b.y)
  const selectedSite = positioned.find(({ id }) => id === selected)
  const cottageSelected = selected === 'cottage'

  function placeObjects(render: (site: SceneSite) => ReactNode) {
    return positioned.map((site) => (
      <g key={site.id} transform={`translate(${site.x} ${site.y}) scale(${site.scale})`}>
        {render(site)}
      </g>
    ))
  }

  return (
    <section className="world-scene" data-sleeping={hidden} aria-labelledby="page-title">
      <WorldCamera overlays={
        <>
          <div className="world-heading">
            <h1 id="page-title">The Hillside</h1>
            {welcome && <p>Every little thing you do builds something here.</p>}
          </div>
          <WorldMessage message={message} dismiss={dismiss} />
          {(selectedSite || cottageSelected) && (
            <div className="map-detail" role="region" aria-label="Selected location">
              <div>
                <strong>{selectedSite?.title ?? 'The cottage'}</strong>
                <p>{selectedSite
                  ? `${selectedSite.stageName} · ${selectedSite.detail}`
                  : 'Every scheduled session helps the hillside grow.'}</p>
              </div>
              <button type="button" className="icon-button" aria-label="Close location details" onClick={() => setSelected(null)}><Icon name="close" size={18} /></button>
            </div>
          )}
        </>
      }>
        <WorldViewport
          viewBox={`0 0 ${SCENE_WIDTH} ${SCENE_HEIGHT}`}
          label="A sunlit hillside cottage beside a winding path, green meadows, and a stream"
          layers={[
            { id: 'landscape', content: <LandscapeLayer /> },
            { id: 'shared', content: <SharedWorldDetails lantern={lantern} garden={garden} /> },
            { id: 'terrain-sites', content: placeObjects((site) => <ConstructionZone stage={site.stage} />) },
            { id: 'cottage', content: <CentralCottage /> },
            { id: 'buildings', content: placeObjects((site) => <Building stage={site.stage} archetype={site.archetype} />) },
            { id: 'vitality', content: placeObjects((site) => <VitalityEffects stage={site.stage} vitality={site.vitality} />) },
            { id: 'ambient', content: <AmbientEffects /> },
          ]}
        />
        <button
          type="button"
          className="map-pin cottage-pin"
          style={scenePosition(COTTAGE.x, COTTAGE.y + 25)}
          aria-label="Explore the cottage"
          aria-pressed={cottageSelected}
          onClick={() => setSelected(cottageSelected ? null : 'cottage')}
        ><Icon name="house" size={18} /><span>Cottage</span></button>
        {positioned.map((site) => (
          <button
            key={site.id} type="button" className="map-pin"
            style={scenePosition(site.x, site.y + 26 * site.scale)}
            aria-label={`${site.title}, ${site.stageName}`}
            aria-pressed={selected === site.id}
            onClick={() => setSelected(selected === site.id ? null : site.id)}
          ><Icon name={site.stage ? 'pin' : 'sprout'} size={18} /><span>{site.title}</span></button>
        ))}
      </WorldCamera>
    </section>
  )
}
