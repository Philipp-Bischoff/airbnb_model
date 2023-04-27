import React, { useState } from 'react'
import './RatingSelector.css'
import '../../Shake.css'

function RatingSelector (props) {
  const [inRange, setInRange] = useState(true)

  const handleClick = action => {
    switch (action) {
      case 'increment':
        if (props.value < 100) {
          props.updateForm(props.type, props.value + 1)
          setInRange(true)
        } else {
          setInRange(false)
        }
        break
      case 'decrement':
        if (props.value > 1) {
          props.updateForm(props.type, props.value - 1)
          setInRange(true)
        } else {
          setInRange(false)
        }
        break
      default:
      // Do nothing
    }
  }

  const handleChange = event => {
    const newValue = parseInt(event.target.value, 10)

    if (newValue > 100 || newValue < 0) {
      setInRange(false)
    } else {
      props.updateForm(props.type, newValue)
      setInRange(true)
    }
  }

  return (
    <div class='range-picker'>
      <div class='picker'>
        <button class='decrement' onClick={() => handleClick('decrement')}>
          {props.buttons[0]}
        </button>
        <input
          type='number'
          value={props.value}
          min='1'
          onChange={handleChange}
          className={inRange ? '' : 'shake'}
        />
        <button class='increment' onClick={() => handleClick('increment')}>
          {props.buttons[1]}
        </button>
      </div>
    </div>
  )
}

export default RatingSelector
