import React, { useState } from 'react'
import './BinaryToggle.css'

function BinaryToggle (props) {
  const [isPrivate, setIsPrivate] = useState(true)

  const handleClick = () => {
    setIsPrivate(!isPrivate)

    props.updateForm(
      'room_type',
      isPrivate ? 'Entire home/apt' : 'Private room'
    )
  }

  return (
    <div className='toggle-button' onClick={handleClick}>
      <div className={`private ${isPrivate ? 'active' : ''}`}>
        <i class='fa-solid fa-person-dress fa-2xl'></i>
      </div>
      <div className={`shared ${isPrivate ? '' : 'active'}`}>
        <i class='fa-solid fa-people-arrows fa-2xl'></i>
      </div>
    </div>
  )
}

export default BinaryToggle

/*
    props.updateForm(prevForm => ({
      ...prevForm,
      room_type: isPrivate ? 'Entire home/apt' : 'Private room'
    }))*/
