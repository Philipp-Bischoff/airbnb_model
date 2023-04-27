import React from 'react'
import './NumberPicker.css'
import { useState } from 'react'
import '../../Shake.css'

function NumberPicker (props) {
  const [inRange, setInRange] = useState(true)

  const handleClick = action => {
    switch (action) {
      case 'increment':
        props.type === 'bedrooms'
          ? props.updateForm('bedrooms', props.value + 1)
          : props.updateForm('person_capacity', props.value + 1)
        break
      case 'decrement':
        if (props.value > 1) {
          props.type === 'bedrooms'
            ? props.updateForm('bedrooms', props.value - 1)
            : props.updateForm('person_capacity', props.value - 1)
          setInRange(true)
        } else {
          setInRange(false)
        }
        break
      default:
      // Do nothing
    }
  }

  return (
    <div class='number-picker'>
      <div class='picker'>
        <button class='decrement' onClick={() => handleClick('decrement')}>
          <i class='fas fa-minus'></i>
        </button>
        <input
          type='number'
          value={props.value}
          min='1'
          className={inRange ? '' : 'shake'}
        />
        <button class='increment' onClick={() => handleClick('increment')}>
          <i class='fas fa-plus'></i>
        </button>
      </div>
    </div>
  )
}

export default NumberPicker
