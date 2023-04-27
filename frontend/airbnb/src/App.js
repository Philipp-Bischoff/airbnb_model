import './App.css'
import React, { useEffect, useState } from 'react'
import mapboxgl from '!mapbox-gl' // eslint-disable-line import/no-webpack-loader-syntax
import DeckGL from '@deck.gl/react'
import { PathLayer, IconLayer } from '@deck.gl/layers'
import Map from 'react-map-gl'
import Home from './assets/House.png'
import Train from './assets/Train.png'
import Center from './assets/Center.png'
import { FlyToInterpolator } from 'deck.gl'
import {
  determineClosestMetro,
  getCoordinates
} from './auxillary-functions/functions'
import AssetForm from './AssetForm'
import Result from './Result'

function App () {
  mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_TOKEN
  const defaultCoordinates = [4.9, 52.36]
  const [prediction, setPrediction] = useState(null)
  const [cityCenter, setCityCenter] = useState([4.895168, 52.370216])
  const [controller, setController] = useState(true)
  const [validEstimation, setValidEstimation] = useState(false)

  const [listingAttributes, setListingAttributes] = useState({
    room_type: 'Entire home/apt',
    person_capacity: 1,
    host_is_superhost: false,
    multi: 0,
    biz: 0,
    cleanliness_rating: 90,
    guest_satisfaction_overall: 90,
    bedrooms: 1,
    dist: 0,
    metro_dist: 0,
    city: 'Amsterdam',
    period: 'weekdays'
  })

  /*ViewState for the Map Component */
  const [initialViewState, setInitialViewState] = useState({
    longitude: 4.895168,
    latitude: 52.370216,
    zoom: 13,
    transitionDuration: 800,
    transitionInterpolator: new FlyToInterpolator()
  })

  useEffect(() => {
    setLayers(getIconAndPathLayer(cityCenter))
  }, [cityCenter])

  const updateForm = (key, value) => {
    setListingAttributes(prevForm => ({ ...prevForm, [key]: value }))
  }

  /*Function that handles when the user returns to the form section*/
  const handleReturn = () => {
    setValidEstimation(false)
    setPrediction(null)
  }

  const fetchData = () => {
    fetch('http://0.0.0.0:80/airbnb_data/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(listingAttributes)
    })
      .then(response => response.json())
      .then(data => {
        setPrediction((10 ** data.prediction[0]).toFixed(0)) //Log-transform back to dollar amount
      })
      .catch(error => {
        window.alert(error)
      })

    setValidEstimation(true)
  }

  const handleSubmit = () => {
    if (
      listingAttributes.dist === '0' ||
      listingAttributes.metro_dist === '0' ||
      listingAttributes.metro_dist === 0 ||
      listingAttributes.dist === 0
    ) {
      window.alert(
        'Please use the map on the right to chose a location for the listing'
      )
      console.log(listingAttributes)
    } else {
      fetchData()
    }
  }

  /**
   * Finds the closest metro
   *
   * TODO: Add more Point-Of-Interest, as the closest public transport is not always a metro.
   *
   * @return [path, distance] from origin to metro
   */
  const findClosestMetro = async coordinates => {
    const radius = 1000 // meters

    const searchEndpoint = `https://api.mapbox.com/geocoding/v5/mapbox.places/train-station.json?proximity=${coordinates[0]},${coordinates[1]}&types=poi&limit=10&radius=${radius}&access_token=${mapboxgl.accessToken}`

    const response = await fetch(searchEndpoint)
    const data = await response.json()
    const stations = data.features

    const coordinateArray = stations.map(item => item.center)

    console.log(determineClosestMetro(coordinates, coordinateArray))

    const coordinates_train_station = determineClosestMetro(
      coordinates,
      coordinateArray
    )

    const returnData = await getDirections(
      coordinates[0],
      coordinates[1],
      coordinates_train_station[1],
      coordinates_train_station[0]
    )

    console.log(returnData)

    return [returnData[0], returnData[1]]
  }

  /**
   * Gets direction from one point to another,
   *
   * @return [path, distance]
   */

  const getDirections = async (
    start_latitude,
    start_longitude,
    end_latitude,
    end_longitude
  ) => {
    const query = `https://api.mapbox.com/directions/v5/mapbox/walking/${end_longitude}%2C${end_latitude}%3B${start_latitude}%2C${start_longitude}?alternatives=true&continue_straight=true&geometries=geojson&language=en&overview=simplified&steps=true&access_token=${mapboxgl.accessToken}`

    let geometryCoordinates
    let pathDistance

    await fetch(query)
      .then(response => response.json())
      .then(data => {
        // extract relevant information from the JSON response
        const route = data.routes[0]
        const distance = route.distance
        geometryCoordinates = route.geometry.coordinates
        pathDistance = distance
      })

    return [geometryCoordinates, pathDistance]
  }

  /**
   * This handles the House, Center and Metro - Icons as well as the path visualization.
   *
   * On first render this only renders a house icon, and then tracks the movement of the icon.
   * Upon DragEnd, we find path to closest metro and city center and add these layers to the layer
   * @return [path, distance]
   */

  const getIconAndPathLayer = (coordinates, layers, cityCenter) => {
    let layerArray = [layers]

    const Icon = new IconLayer({
      id: 'icon',
      data: [coordinates],
      getIcon: d => ({
        url: Home,
        width: 128,
        height: 128
      }),
      getPosition: d => d,
      getSize: 35,
      pickable: true,
      onDragStart: ({ coordinate }) => {
        setController(false)
      },
      onDrag: ({ coordinate }) => {
        console.log(`getIconLayercalled from onDrag`)
        setLayers([getIconAndPathLayer(coordinate, [], cityCenter)])
      },
      onDragEnd: async ({ coordinate }) => {
        setController(true)

        /*Path to closest city metro*/
        const pathData = await findClosestMetro(coordinate)

        const metro_path = pathData[0]
        const metro_distance = pathData[1]

        /*Retrieving the coordinate for the icon*/
        const coordinatesMetro = [metro_path[0][0], metro_path[0][1]]

        /*Get current city center*/
        const currentCityCenter = await getCoordinates(listingAttributes.city)

        /*Get path from icon to city center*/
        const pathDataCenter = await getDirections(
          coordinate[0],
          coordinate[1],
          currentCityCenter[1],
          currentCityCenter[0]
        )

        const center_path = pathDataCenter[0]
        const center_distance = pathDataCenter[1]

        /*Get coordinates for icon*/
        const coordinatesCenter = [center_path[0][0], center_path[0][1]]

        updateForm('dist', (center_distance / 1000).toFixed(1))
        updateForm('metro_dist', (metro_distance / 1000).toFixed(1))

        /*Creating the icons for metro, center and paths to both from home*/
        const pathLayer = [
          /*Line layer to metro*/
          new PathLayer({
            id: 'path-layer',
            data: [{ path: metro_path }],
            getWidth: 5,
            getColor: [255, 0, 0],
            widthMinPixels: 2
          }),

          /*Icon for Metro*/
          new IconLayer({
            id: 'icon_metro',
            data: [coordinatesMetro],
            getIcon: d => ({
              url: Train,
              width: 128,
              height: 128
            }),
            getPosition: d => d,
            getSize: 35
          }),

          new PathLayer({
            id: 'path-layer-center',
            data: [{ path: center_path }],
            getWidth: 5,
            getColor: [255, 0, 0],
            widthMinPixels: 2
          }),

          new IconLayer({
            id: 'icon_center',
            data: [coordinatesCenter],
            getIcon: d => ({
              url: Center,
              width: 128,
              height: 128
            }),
            getPosition: d => d,
            getSize: 35
          })
        ]
        setLayers([getIconAndPathLayer(coordinate, pathLayer, cityCenter)])
      }
    })

    layerArray.push(Icon)
    return [layerArray]
  }

  const [layers, setLayers] = useState(
    getIconAndPathLayer(defaultCoordinates, [], cityCenter)
  )

  return (
    <div className='App'>
      <div className='map-container' style={{ position: 'relative' }}>
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
      </div>
      {!validEstimation && prediction === null ? (
        <AssetForm
          updateForm={updateForm}
          listingAttributes={listingAttributes}
          getIconAndPathLayer={getIconAndPathLayer}
          setLayers={setLayers}
          setInitialViewState={setInitialViewState}
          setCityCenter={setCityCenter}
          handleSubmit={handleSubmit}
        />
      ) : (
        <Result
          listingAttributes={listingAttributes}
          prediction={prediction}
          handleReturn={handleReturn}
        ></Result>
      )}
    </div>
  )
}

export default App
