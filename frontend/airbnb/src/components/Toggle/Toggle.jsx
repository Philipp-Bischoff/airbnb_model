import React, { useState } from 'react'
import styled, { css } from 'styled-components'

const ButtonWrapper = styled.div`
  background-color: #fff;
  box-shadow: 0 0 4px rgba(0, 0, 0, 0.2);
  border: 1px solid #ccc;
  border-radius: 4px;
  width: 70%;
  height: 60px;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-evenly;

  ${props =>
    props.isActive &&
    css`
      background-color: #ff5a5f;
      transition: background-color 0.2s ease-in-out;
    `}
`

const ButtonIcon = styled.i`
  /* Add any styles you need for the icon here */
`

function Button (props) {
  const [isActive, setIsActive] = useState(false)

  const handleClick = () => {
    setIsActive(!isActive)
    props.updateForm(props.type, isActive ? 0 : 1)
  }

  return (
    <ButtonWrapper isActive={isActive} onClick={handleClick}>
      <ButtonIcon className={props.icon} />
    </ButtonWrapper>
  )
}

export default Button
