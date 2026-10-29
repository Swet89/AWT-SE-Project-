import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { calculateTotalRouteDistance, estimateTransitTimeMinutes } from '../lib/geoUtils.js'
import './InteractiveRouteMap.css'

// 100% Free & Open High-Definition Tile Providers (Zero API Key, No Watermark)
const TILE_LAYERS = {
  voyager: {
    name: 'Street (Light)',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; StreetMap',
    maxZoom: 19,
    subdomains: 'abc',
  },
  dark: {
    name: 'Dark Voyage',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Dark Canvas',
    maxZoom: 19,
    subdomains: 'abc',
  },
  satellite: {
    name: 'Satellite View',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; High-Res Aerial',
    maxZoom: 18,
    subdomains: 'abc',
  },
  osm: {
    name: 'OpenStreetMap',
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
    subdomains: 'abc',
  },
}

// Distinct jewel tones for different itinerary days
const DAY_COLORS = ['#d4af37', '#20b2aa', '#e06666', '#9370db', '#e67e22', '#3498db', '#1abc9c']

export default function InteractiveRouteMap({
  title = 'Interactive 2D Route Map',
  subtitle = 'Curated waypoints, geographic topology, and travel metrics',
  routes = [], // Array of { id, label, color, waypoints: [...] }
  initialCenter = null,
  initialZoom = 13,
  height = '480px',
  allowDaySelection = true,
}) {
  const mapContainerRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const layerGroupRef = useRef(null)
  const tileLayerRef = useRef(null)

  // Detect system theme or current html data-theme
  const isDark = document.documentElement.dataset.theme === 'dark'
  const [tileStyle, setTileStyle] = useState(isDark ? 'dark' : 'voyager')
  const [selectedRouteId, setSelectedRouteId] = useState('all')
  const [activeWaypoint, setActiveWaypoint] = useState(null)
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Filter routes according to selected tab
  const activeRoutes = selectedRouteId === 'all'
    ? routes
    : routes.filter((r) => r.id === selectedRouteId)

  // Flatten all active waypoints
  const allActiveWaypoints = activeRoutes.flatMap((r, rIdx) =>
    (r.waypoints || []).map((w, wIdx) => ({
      ...w,
      routeColor: r.color || DAY_COLORS[rIdx % DAY_COLORS.length],
      routeLabel: r.label,
      globalIndex: wIdx + 1,
    }))
  )

  // Calculate route distance and transit time
  const totalDistanceKm = calculateTotalRouteDistance(allActiveWaypoints)
  const estimatedTransitMins = estimateTransitTimeMinutes(totalDistanceKm)

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return

    // Clean up any stale Leaflet instance or container ID from StrictMode or previous mounts
    if (mapInstanceRef.current) {
      try {
        mapInstanceRef.current.remove()
      } catch (err) {
        // ignore removal errors
      }
      mapInstanceRef.current = null
    }
    if (mapContainerRef.current && mapContainerRef.current._leaflet_id) {
      delete mapContainerRef.current._leaflet_id
    }

    // Fallback coordinates (Agra) if none provided
    const defaultLat = initialCenter?.lat || (allActiveWaypoints[0]?.lat) || 27.1767
    const defaultLon = initialCenter?.lon || (allActiveWaypoints[0]?.lon) || 78.0081

    const map = L.map(mapContainerRef.current, {
      center: [defaultLat, defaultLon],
      zoom: initialZoom,
      zoomControl: false, // Custom position
      scrollWheelZoom: false, // Prevent page scroll hijack
    })
    mapInstanceRef.current = map

    // Zoom control at top-right
    L.control.zoom({ position: 'topright' }).addTo(map)

    // Layer group for route polylines and markers
    const layerGroup = L.layerGroup().addTo(map)
    layerGroupRef.current = layerGroup

    // Set initial tile layer
    const tileConfig = TILE_LAYERS[tileStyle] || TILE_LAYERS.voyager
    const tiles = L.tileLayer(tileConfig.url, {
      attribution: tileConfig.attribution,
      subdomains: tileConfig.subdomains || 'abc',
      maxZoom: tileConfig.maxZoom || 19,
    }).addTo(map)
    tileLayerRef.current = tiles

    // Enable wheel zoom on focus/click
    map.on('click', () => map.scrollWheelZoom.enable())
    map.on('mouseout', () => map.scrollWheelZoom.disable())

    return () => {
      try {
        map.remove()
      } catch (err) {
        // ignore
      }
      mapInstanceRef.current = null
      if (mapContainerRef.current && mapContainerRef.current._leaflet_id) {
        delete mapContainerRef.current._leaflet_id
      }
    }
  }, [])

  // Update Tile Layer when tileStyle changes
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map) return

    if (tileLayerRef.current) {
      try {
        map.removeLayer(tileLayerRef.current)
      } catch (err) {
        // ignore
      }
    }

    const tileConfig = TILE_LAYERS[tileStyle] || TILE_LAYERS.voyager
    const tiles = L.tileLayer(tileConfig.url, {
      attribution: tileConfig.attribution,
      subdomains: tileConfig.subdomains || 'abc',
      maxZoom: tileConfig.maxZoom || 19,
    }).addTo(map)
    tileLayerRef.current = tiles
  }, [tileStyle])

  // Redraw Waypoints and Polylines when activeRoutes or selectedRouteId change
  useEffect(() => {
    const map = mapInstanceRef.current
    const layerGroup = layerGroupRef.current
    if (!map || !layerGroup) return

    layerGroup.clearLayers()

    if (allActiveWaypoints.length === 0) return

    const latLngBounds = []

    // Draw each route's polyline
    activeRoutes.forEach((route, rIdx) => {
      const color = route.color || DAY_COLORS[rIdx % DAY_COLORS.length]
      const waypoints = route.waypoints || []
      const routePoints = waypoints
        .filter((w) => typeof w.lat === 'number' && typeof w.lon === 'number')
        .map((w) => [w.lat, w.lon])

      if (routePoints.length > 1) {
        // Outer glowing path
        L.polyline(routePoints, {
          color: color,
          weight: 6,
          opacity: 0.35,
          lineCap: 'round',
          lineJoin: 'round',
        }).addTo(layerGroup)

        // Inner dashed route line
        L.polyline(routePoints, {
          color: color,
          weight: 3.5,
          opacity: 0.95,
          dashArray: '8, 8',
          lineCap: 'round',
          lineJoin: 'round',
        }).addTo(layerGroup)
      }
    })

    // Draw numbered luxury markers
    allActiveWaypoints.forEach((wp, idx) => {
      if (typeof wp.lat !== 'number' || typeof wp.lon !== 'number') return

      latLngBounds.push([wp.lat, wp.lon])
      const color = wp.routeColor || '#d4af37'
      const num = wp.globalIndex || idx + 1

      // Custom HTML Marker using L.divIcon
      const iconHtml = `
        <div class="odyssey-map-marker ${activeWaypoint?.id === wp.id ? 'is-active' : ''}" style="--marker-color: ${color}">
          <span class="marker-pulse"></span>
          <div class="marker-core">
            <span class="marker-number">${num}</span>
          </div>
          <span class="marker-label">${wp.name}</span>
        </div>
      `

      const customIcon = L.divIcon({
        className: 'odyssey-leaflet-marker-wrap',
        html: iconHtml,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
        popupAnchor: [0, -22],
      })

      const marker = L.marker([wp.lat, wp.lon], { icon: customIcon }).addTo(layerGroup)

      // Popup Content
      const popupHtml = `
        <div class="odyssey-popup-card">
          ${wp.imageUrl ? `<div class="popup-image" style="background-image: url('${wp.imageUrl}')"></div>` : ''}
          <div class="popup-body">
            <span class="popup-tag" style="background: ${color}22; color: ${color}; border-color: ${color}44;">
              ${wp.routeLabel || `Stop ${num}`}
            </span>
            <h4 class="popup-title">${wp.name}</h4>
            ${wp.subtitle ? `<p class="popup-subtitle">${wp.subtitle}</p>` : ''}
            ${wp.description ? `<p class="popup-desc">${wp.description}</p>` : ''}
            <div class="popup-footer">
              ${wp.cost ? `<span class="popup-cost">Est. ₹${Number(wp.cost).toLocaleString('en-IN')}</span>` : '<span></span>'}
              <a href="https://www.google.com/maps/search/?api=1&query=${wp.lat},${wp.lon}" target="_blank" rel="noreferrer" class="popup-directions-btn">
                Directions ↗
              </a>
            </div>
          </div>
        </div>
      `

      marker.bindPopup(popupHtml, {
        className: 'odyssey-custom-leaflet-popup',
        maxWidth: 290,
      })

      marker.on('click', () => {
        setActiveWaypoint(wp)
      })
    })

    // Fit map bounds to show all markers gracefully
    if (latLngBounds.length > 0) {
      map.fitBounds(latLngBounds, {
        padding: [45, 45],
        maxZoom: 15,
        animate: true,
      })
    }
  }, [selectedRouteId, routes])

  // Center on a specific waypoint when clicked from the list
  const focusWaypoint = (wp) => {
    setActiveWaypoint(wp)
    const map = mapInstanceRef.current
    if (map && typeof wp.lat === 'number' && typeof wp.lon === 'number') {
      map.flyTo([wp.lat, wp.lon], 15, { duration: 0.9 })
    }
  }

  // Fit all active waypoints into view
  const fitAllBounds = () => {
    const map = mapInstanceRef.current
    if (!map || allActiveWaypoints.length === 0) return
    const latLngBounds = allActiveWaypoints
      .filter((w) => typeof w.lat === 'number' && typeof w.lon === 'number')
      .map((w) => [w.lat, w.lon])

    if (latLngBounds.length > 0) {
      map.fitBounds(latLngBounds, {
        padding: [45, 45],
        maxZoom: 15,
        animate: true,
      })
    }
  }

  return (
    <section className={`odyssey-route-map-section ${isFullscreen ? 'is-fullscreen' : ''}`}>
      {/* Header Bar */}
      <div className="route-map-header">
        <div className="route-map-titles">
          <div className="route-map-eyebrow">
            <span className="route-map-badge-icon">🗺️</span>
            <span>2D TOPOGRAPHIC ROUTE TOPOLOGY</span>
          </div>
          <h3 className="route-map-title">{title}</h3>
          {subtitle && <p className="route-map-subtitle">{subtitle}</p>}
        </div>

        {/* Map Control Tools */}
        <div className="route-map-controls">
          {/* Tile Layer Selector */}
          <div className="route-map-layer-switcher" role="group" aria-label="Map Tile Style">
            <button
              type="button"
              className={`map-layer-btn ${tileStyle === 'voyager' ? 'is-active' : ''}`}
              onClick={() => setTileStyle('voyager')}
              title="Esri Street Map (Clean, No Watermark)"
            >
              Street
            </button>
            <button
              type="button"
              className={`map-layer-btn ${tileStyle === 'dark' ? 'is-active' : ''}`}
              onClick={() => setTileStyle('dark')}
              title="Dark Canvas (Luxury Dark Mode)"
            >
              Dark
            </button>
            <button
              type="button"
              className={`map-layer-btn ${tileStyle === 'satellite' ? 'is-active' : ''}`}
              onClick={() => setTileStyle('satellite')}
              title="Satellite Aerial Imagery"
            >
              Satellite
            </button>
            <button
              type="button"
              className={`map-layer-btn ${tileStyle === 'osm' ? 'is-active' : ''}`}
              onClick={() => setTileStyle('osm')}
              title="OpenStreetMap Standard"
            >
              OSM
            </button>
          </div>

          <button
            type="button"
            className="map-action-btn"
            onClick={fitAllBounds}
            title="Recenter and fit all stops into view"
          >
            <span>⛶</span> Fit Stops
          </button>

          <button
            type="button"
            className="map-action-btn"
            onClick={() => {
              setIsFullscreen((prev) => !prev)
              setTimeout(() => mapInstanceRef.current?.invalidateSize(), 300)
            }}
            title={isFullscreen ? 'Exit Fullscreen' : 'Expand Fullscreen'}
          >
            {isFullscreen ? '✕ Exit' : '⛶ Fullscreen'}
          </button>
        </div>
      </div>

      {/* Day / Route Filter Tabs (for multi-day itineraries) */}
      {allowDaySelection && routes.length > 1 && (
        <div className="route-map-tabs" role="tablist">
          <button
            type="button"
            className={`route-tab ${selectedRouteId === 'all' ? 'is-active' : ''}`}
            onClick={() => setSelectedRouteId('all')}
            role="tab"
            aria-selected={selectedRouteId === 'all'}
          >
            Full Journey Circuit ({routes.length} Days)
          </button>
          {routes.map((route, rIdx) => (
            <button
              key={route.id}
              type="button"
              className={`route-tab ${selectedRouteId === route.id ? 'is-active' : ''}`}
              style={{
                '--tab-color': route.color || DAY_COLORS[rIdx % DAY_COLORS.length],
              }}
              onClick={() => setSelectedRouteId(route.id)}
              role="tab"
              aria-selected={selectedRouteId === route.id}
            >
              <span className="route-tab-dot" />
              {route.label || `Day ${rIdx + 1}`}
            </button>
          ))}
        </div>
      )}

      {/* Metrics Strip */}
      <div className="route-map-metrics-bar">
        <div className="route-metric-item">
          <span className="metric-label">Waypoints</span>
          <strong className="metric-value">{allActiveWaypoints.length} Stops</strong>
        </div>
        <div className="route-metric-separator" />
        <div className="route-metric-item">
          <span className="metric-label">Route Distance</span>
          <strong className="metric-value">
            {totalDistanceKm > 0 ? `~${totalDistanceKm.toFixed(1)} km` : 'Local Circuit'}
          </strong>
        </div>
        <div className="route-metric-separator" />
        <div className="route-metric-item">
          <span className="metric-label">Est. Transit Time</span>
          <strong className="metric-value">~{estimatedTransitMins} mins</strong>
        </div>
        <div className="route-metric-separator" />
        <div className="route-metric-item hint-item">
          <span className="metric-label">Navigation</span>
          <span className="metric-hint">Click any pin or stop below to explore</span>
        </div>
      </div>

      {/* Leaflet Map Stage */}
      <div
        ref={mapContainerRef}
        className="odyssey-leaflet-container"
        style={{ height }}
        role="region"
        aria-label="Interactive 2D Route Map"
      />

      {/* Waypoints Sequence Rail */}
      {allActiveWaypoints.length > 0 && (
        <div className="route-waypoints-rail">
          <div className="waypoints-rail-header">
            <h4>Route Waypoints Sequence:</h4>
            <span>{allActiveWaypoints.length} stops linked in order</span>
          </div>
          <div className="waypoints-scroll-grid">
            {allActiveWaypoints.map((wp, idx) => {
              const isSelected = activeWaypoint?.id === wp.id
              const color = wp.routeColor || '#d4af37'
              return (
                <div
                  key={wp.id || idx}
                  className={`waypoint-rail-card ${isSelected ? 'is-active' : ''}`}
                  onClick={() => focusWaypoint(wp)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      focusWaypoint(wp)
                    }
                  }}
                >
                  <div className="waypoint-card-top">
                    <span className="waypoint-card-num" style={{ backgroundColor: color }}>
                      {wp.globalIndex || idx + 1}
                    </span>
                    <span className="waypoint-card-badge">{wp.routeLabel || wp.category || 'Sight'}</span>
                  </div>
                  <h5 className="waypoint-card-name">{wp.name}</h5>
                  {wp.subtitle && <p className="waypoint-card-time">{wp.subtitle}</p>}
                  {wp.description && (
                    <p className="waypoint-card-desc">
                      {wp.description.slice(0, 95)}
                      {wp.description.length > 95 ? '…' : ''}
                    </p>
                  )}
                  <div className="waypoint-card-action">
                    <span>Focus on map →</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </section>
  )
}
