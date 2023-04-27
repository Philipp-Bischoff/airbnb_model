import './App.css'
import React, { useEffect, useState } from 'react'
import mapboxgl from '!mapbox-gl' // eslint-disable-line import/no-webpack-loader-syntax
import DeckGL from '@deck.gl/react'
import { PathLayer, IconLayer } from '@deck.gl/layers'
import Map from 'react-map-gl'
import Logo from './assets/airbnb-logo.svg'
import NumberPicker from './components/NumberPicker/NumberPicker.jsx'
import BinaryToggle from './components/BinaryToggle/BinaryToggle.jsx'
import Toggle from './components/Toggle/Toggle.jsx'
import List from './components/CountryPicker/List.jsx'
import RatingSelector from './components/RatingSelector/RatingSelector.jsx'
import Home from './assets/House.png'
import Train from './assets/Train.png'
import Center from './assets/Center.png'
import { FlyToInterpolator } from 'deck.gl'
import { motion } from 'framer-motion'
import { cities } from './assets/cities'
import {
  determineClosestMetro,
  getCoordinates
} from './auxillary-functions/functions'

function App () {
  mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_TOKEN

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

  const [initialViewState, setInitialViewState] = useState({
    longitude: 4.895168,
    latitude: 52.370216,
    zoom: 13,
    transitionDuration: 800,
    transitionInterpolator: new FlyToInterpolator()
  })

  const [defaultCoordinates, setDefaultCoordinates] = useState([4.9, 52.36])
  const [prediction, setPrediction] = useState(null)
  const [cityCenter, setCityCenter] = useState([4.895168, 52.370216])
  const [controller, setController] = useState(true)
  const [validEstimation, setValidEstimation] = useState(false)

  useEffect(() => {
    setLayers(getIconLayer(cityCenter))
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
        console.log(data)
        setPrediction((10 ** data.prediction[0]).toFixed(0))
      })
      .catch(error => {
        console.error(error)
      })

    setValidEstimation(true)
    console.log(listingAttributes)
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

  /*Finds the closest metro* and returns [path, distance] of the metro*/
  const findClosestMetro = async coordinates => {
    const radius = 1000 // meters

    const searchEndpoint = `https://api.mapbox.com/geocoding/v5/mapbox.places/train-station.json?proximity=${coordinates[0]},${coordinates[1]}&types=poi&limit=10&radius=${radius}&access_token=${mapboxgl.accessToken}`

    const response = await fetch(searchEndpoint)
    const data = await response.json()
    const stations = data.features

    console.dir(stations)

    //TODO: Return the closest station.

    const coordinateArray = stations.map(item => item.center)

    console.log(coordinateArray)

    console.log(determineClosestMetro(coordinates, coordinateArray))

    const name = stations[0].place_name
    const coordinates_train_station = determineClosestMetro(
      coordinates,
      coordinateArray
    )

    //console.log(`Found station ${name} at ${coordinates_train_station}`)

    const returnData = await getDirections(
      coordinates[0],
      coordinates[1],
      coordinates_train_station[1],
      coordinates_train_station[0]
    )

    console.log(returnData)

    return [returnData[0], returnData[1]]
  }

  /*Gets direction from one point to another, returns [path, distance] as we need this if we just want to find the city center*/
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

    /*setListingAttributes(prevForm => ({
      ...prevForm,
      metro_dist: Math.trunc(pathDistance).toString() + 'm'
    }))*/

    console.log(`distance : ${pathDistance}`)

    return [geometryCoordinates, pathDistance]
  }

  const getIconLayer = (coordinates, layers, cityCenter) => {
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
        setLayers([getIconLayer(coordinate, [], cityCenter)])
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

        console.log(
          `the center is ${center_distance}m and the next metro is ${metro_distance}m away`
        )

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
        setLayers([getIconLayer(coordinate, pathLayer, cityCenter)])
      }
    })

    layerArray.push(Icon)
    return [layerArray]
  }

  const [layers, setLayers] = useState(
    getIconLayer(defaultCoordinates, [], cityCenter)
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
        <motion.div
          className='form-div'
          key='form-div'
          initial={{ y: '-100vh' }}
          animate={{ y: 0 }}
          transition={{ duration: 0.5, type: 'spring', stiffness: 80 }}
          exit={{ y: '100vh' }}
        >
          <img src={Logo} alt='airnb-logo' class='header-image' />
          <div className='grid-button private-or-shared'>
            <p className='p-style'>Private/shared</p>
            <BinaryToggle updateForm={updateForm}></BinaryToggle>
          </div>
          <div className='grid-button bedrooms-capacity'>
            <p className='p-style'>Bedrooms</p>
            <RatingSelector
              type='bedrooms'
              updateForm={updateForm}
              value={listingAttributes.bedrooms}
              buttons={[<i class='fas fa-minus' />, <i class='fas fa-plus' />]}
            />
          </div>
          <div className='grid-button people-capacity'>
            <p>Guests</p>
            <RatingSelector
              type='person_capacity'
              updateForm={updateForm}
              value={listingAttributes.person_capacity}
              buttons={[<i class='fas fa-minus' />, <i class='fas fa-plus' />]}
            />
          </div>
          <div className='grid-button superhost'>
            <p>Superhost</p>
            <Toggle
              icon={'fa-regular fa-face-grin-stars fa-xl'}
              updateForm={updateForm}
              type='host_is_superhost'
            ></Toggle>
          </div>
          <div className='grid-button multi-listing'>
            <p>Multi-Listing</p>
            <Toggle
              icon={'fa-solid fa-list fa-xl'}
              updateForm={updateForm}
              type='multi'
            ></Toggle>
          </div>
          <div className='grid-button business-listing'>
            <p>Business-Listing</p>
            <Toggle
              icon={'fa-solid fa-user-tie fa-xl'}
              updateForm={updateForm}
              type='biz'
            ></Toggle>
          </div>
          <div className='grid-button city-list'>
            <p>City</p>
            <List
              cities={cities}
              setInitialViewState={setInitialViewState}
              getIconLayer={getIconLayer}
              setLayers={setLayers}
              setCityCenter={setCityCenter}
              updateForm={updateForm}
            ></List>
          </div>
          <div className='grid-button cleanliness'>
            <p>Cleanliness</p>
            <RatingSelector
              type='cleanliness_rating'
              value={listingAttributes.cleanliness_rating}
              updateForm={updateForm}
              buttons={[
                <i class='fa-solid fa-caret-left' />,
                <i class='fa-solid fa-caret-right' />
              ]}
            />
          </div>
          <div className='grid-button guest-satisfaction'>
            <p>Guest Satisfaction</p>
            <RatingSelector
              type='guest_satisfaction_overall'
              updateForm={updateForm}
              value={listingAttributes.guest_satisfaction_overall}
              buttons={[
                <i class='fa-solid fa-caret-left' />,
                <i class='fa-solid fa-caret-right' />
              ]}
            />
          </div>
          <div
            onClick={() => handleSubmit()}
            className='grid-button calculate-rate'
          >
            Calculate Rate
          </div>
        </motion.div>
      ) : (
        <motion.div
          className='form-div-result'
          key='form-div-result'
          initial={{ y: '-100vh' }}
          animate={{ y: 0 }}
          transition={{ duration: 0.5, type: 'spring', stiffness: 80 }}
          exit={{ y: '100vh' }}
        >
          <img src={Logo} alt='airnb-logo' class='header-image-result' />
          <div className='result-text'>
            <h1> Your listing for {listingAttributes.city}</h1>
            <p style={{ fontSize: '20px' }}>
              {' '}
              For your {listingAttributes.bedrooms} bedroom and{' '}
              {listingAttributes.person_capacity} person property you can expect
              to be able to charge{' '}
              <div>
                <h2>{prediction}$</h2>
              </div>
            </p>
          </div>
          <button onClick={() => handleReturn()} className='return-button'>
            Return
          </button>
        </motion.div>
      )}
    </div>
  )
}

export default App

/*

          <div className='dist'>
            <p>Distance from Center</p>
            <Distance
              icon={'fa-solid fa-arrows-to-circle'}
              distance={form.metro_dist}
            ></Distance>
          </div>
          <div className='dist-metro'>
            <p>Distance from Metro</p>
            <Distance
              icon={'fa-solid fa-train'}
              distance={form.dist}
            ></Distance>
          </div>

const getIconLayer = coordinates => {
    return new IconLayer({
      id: 'icon',
      data: [coordinates],
      getIcon: d => ({
        url: 'https://upload.wikimedia.org/wikipedia/commons/2/25/Blisk-logo-512-512-background-transparent.png',
        width: 128,
        height: 128
      }),
      getPosition: d => d,
      getSize: 50,
      pickable: true,
      onDragStart: () => {
        setController(false)
      },
      onDrag: ({ coordinate }) => {
        setLayers([getIconLayer(coordinate)])
        console.log(`coordinates during drag: ${coordinate}`)
      },
      onDragEnd: async ({ coordinate }) => {
        setController(true)

        console.log('Drag stoped +  calling clostest metro')
        console.log(`coordinates ${coordinates}`)

        const pathData = await findClosestMetro(coordinate)

        const pathLayer = [
          new PathLayer({
            id: 'path-layer',
            data: [{ path: pathData }],
            getWidth: 5,
            getColor: [255, 0, 0],
            widthMinPixels: 2
          })
        ]
        setLayers([getIconLayer(coordinate), pathLayer])
      }
    })
  }




  This is a working layer:

  const layers3 = [
    new PathLayer({
      id: 'path-layer',
      data: [
        {
          path: [
            [4.900911, 52.37792],
            [4.900918, 52.377657],
            [4.901996, 52.377338],
            [4.901862, 52.377091],
            [4.902021, 52.377054],
            [4.901952, 52.376929],
            [4.902255, 52.376728],
            [4.902268, 52.376595],
            [4.900985, 52.374265],
            [4.900072, 52.374533],
            [4.896783, 52.371533],
            [4.89669, 52.371566]
          ]
        }
      ],
      getWidth: 5,
      getColor: [255, 0, 0],
      widthMinPixels: 2
    })
  ]

   TODO: find closest metro?
    const distances = stations.map(station => {
      const stationCoordinates = station.geometry.coordinates

      //const distance = getDistance(markerCoordinates, stationCoordinates);

      return { station }
    })

  const mapStyle = {
    width: '100vw',
    height: '100vh'
  }

   const transformList = list => {
    const transformedList = []
    for (let i = 0; i < list.length; i += 2) {
      transformedList.push([list[i], list[i + 1]])
    }
    return transformedList
  }

  const pairsFromString = str => {
    const arr = str.split(',')
    const pairs = []
    for (let i = 0; i < arr.length; i += 2) {
      pairs.push([parseFloat(arr[i]), parseFloat(arr[i + 1])])
    }
    return pairs
  }

  const [pathData, setPathData] = useState([])

  const [isMarkerDragged, setIsMarkerDragged] = useState(false)

  const [marker, setMarker] = useState({
    longitude: 4.896727554656138,
    latitude: 52.37160469441662
  })

  useEffect(() => {
    if (isMarkerDragged) {
      findClosestMetro()
    }
  }, [isMarkerDragged])



  const onMarkerDragEnd = useCallback(event => {
    setMarker({
      longitude: event.lngLat.lng,
      latitude: event.lngLat.lat
    })

    setIsMarkerDragged(true)
  }, [])

  const getIconLayer1 = () => {
    return new IconLayer({
      id: 'icon',
      data: [marker.latitude, marker.longitude],
      getIcon: d => ({
        url: 'https://upload.wikimedia.org/wikipedia/commons/2/25/Blisk-logo-512-512-background-transparent.png',
        width: 128,
        height: 128
      }),
      getPosition: d => d,
      getSize: 200,
      pickable: true,
      onDragStart: () => {
        console.log('start')
      },
      onDrag: ({ coordinate }) => {
        console.log('drag')
      },
      onDragEnd: () => {
        console.log('END')
      }
    })
  }

 
          <Marker
            longitude={marker.longitude}
            latitude={marker.latitude}
            onDragEnd={onMarkerDragEnd}
            draggable
          >
            <Pin size={20} />
          </Marker>



return (
    <div className='App'>
      <div>
        <DeckGL {...initialViewState}>
          {pathData && (
            <PathLayer
              data={pathData}
              getPath={d => d.path}
              getColor={d => [255, 0, 0]}
              getWidth={d => 5}
              widthUnits='pixels'
              rounded
            />
          )}
          <Static Map
            initialViewState={initialViewState}
            mapStyle='mapbox://styles/mapbox/dark-v9'
            mapboxAccessToken='pk.eyJ1IjoidmluY2VudHZlZ2E5NSIsImEiOiJjbDd2enI4OGQwODB0M3d1YnhnZXB1ZjUzIn0.UX-Z9XdNuo0RRSOxfwjZlA'
            style={mapStyle}
          >
            <Marker
              longitude={marker.longitude}
              latitude={marker.latitude}
              anchor='center'
              draggable
              //onDrag={onMarkerDrag}
              onDragEnd={onMarkerDragEnd}
              //onDragStart={onMarkerDragStart}
            >
              <Pin size={20} />
            </Marker>
            <NavigationControl />
          </Static Map>
        </DeckGL>
      </div>
    </div>
  )*/

/*<div ref={mapContainer} className='map-container' />

  //const onMarkerDrag = useCallback(event => {}, [])

  {
          pathData && [
            new PathLayer({
              data: pathData,
              getPath: d => d.path,
              getColor: d => [255, 0, 0],
              getWidth: d => 5,
              widthUnits: 'pixels',
              rounded: true
            })
          ]
        }


*/

/*
  useEffect(() => {
    if (map.current) return // initialize map only once
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [lng, lat],
      zoom: zoom
    })
  })

  useEffect(() => {
    if (!map.current) return // wait for map to initialize
    map.current.on('move', () => {
      setLng(map.current.getCenter().lng.toFixed(4))
      setLat(map.current.getCenter().lat.toFixed(4))
      setZoom(map.current.getZoom().toFixed(2))
    })
  })*/

/*  const onMarkerDragStart = useCallback(event => {
    logEvents(_events => ({ ..._events, onDragStart: event.lngLat }))
  }, [])

  const onMarkerDrag = useCallback(event => {
    logEvents(_events => ({ ..._events, onDrag: event.lngLat }))

    setMarker({
      longitude: event.lngLat.lng,
      latitude: event.lngLat.lat
    })
  }, [])

  const onMarkerDragEnd = useCallback(event => {
    logEvents(_events => ({ ..._events, onDragEnd: event.lngLat }))
  }, [])*/

/*    geocodingClient
      .reverseGeocode({
        query: [marker.latitude, marker.longitude],
        types: 'poi',
        proximity: marker,
        poiTypes: 'metro-station'
      })
      .send()
      .then(response => {
        const metroStation = response.body.features[0]
        const metroStationCoords = metroStation.geometry.coordinates
        console.log(metroStationCoords)
      })
      */
