import React from 'react'
import { motion } from 'framer-motion'
import Logo from './assets/airbnb-logo.svg'

function Result (props) {
  return (
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
        <h1> Your listing for {props.listingAttributes.city}</h1>
        <p style={{ fontSize: '20px' }}>
          {' '}
          For your {props.listingAttributes.bedrooms} bedroom and{' '}
          {props.listingAttributes.person_capacity} person property you can
          expect to be able to charge{' '}
          <div>
            <h2>{props.prediction}$</h2>
          </div>
        </p>
      </div>
      <button onClick={() => props.handleReturn()} className='return-button'>
        Return
      </button>
    </motion.div>
  )
}

export default Result
