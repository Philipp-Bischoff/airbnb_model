import React from 'react'
import './List.css'

function List (props) {
  const onChange = event => {
    const value = event.target.value.split(',').map(parseFloat)
    const cityName = event.target.value.split(',')[2]

    /*Changing viewState of the Map to new City*/
    props.setInitialViewState(prevViewState => ({
      ...prevViewState,
      longitude: value[0],
      latitude: value[1]
    }))

    props.setCityCenter(value)

    props.updateForm('city', cityName)
    props.updateForm('dist', 0)
    props.updateForm('dist_metro', 0)
  }

  return (
    <div className='list-wrapper'>
      <select onChange={onChange} className='list'>
        {props.cities.map(city => {
          return (
            <option value={`${city.coordinates},${city.cityName}`}>
              {city.cityName}
            </option>
          )
        })}
      </select>
    </div>
  )
}

export default List
