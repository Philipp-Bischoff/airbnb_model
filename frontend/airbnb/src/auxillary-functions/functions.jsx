import { cities } from '../assets/cities'

export const determineClosestMetro = (origin, coordinates) => {
  let minDistance = Infinity
  let closestCoord = null

  coordinates.forEach(coord => {
    const distance = Math.sqrt(
      Math.pow(coord[0] - origin[0], 2) + Math.pow(coord[1] - origin[1], 2)
    )
    if (distance < minDistance) {
      minDistance = distance
      closestCoord = coord
    }
  })

  return closestCoord
}

export const getCoordinates = async cityName => {
  const city = cities.find(city => city.cityName === cityName)
  if (city) {
    return city.coordinates
  } else {
    window.alert('City not found')
  }
}
