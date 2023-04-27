import React from 'react'

function Map () {
  return (
    <DeckGL
      initialViewState={initialViewState}
      controller={controller}
      layers={layers}
    >
      <Map
        mapboxAccessToken={process.env.REACT_APP_MAPBOX_TOKEN}
        mapStyle='mapbox://styles/mapbox/dark-v11'
      />
    </DeckGL>
  )
}

export default Map
