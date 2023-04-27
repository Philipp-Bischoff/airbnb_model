import React from 'react'
import BinaryToggle from './components/BinaryToggle/BinaryToggle.jsx'
import Toggle from './components/Toggle/Toggle.jsx'
import List from './components/CountryPicker/List.jsx'
import RatingSelector from './components/RatingSelector/RatingSelector.jsx'
import { cities } from './assets/cities.jsx'
import { motion } from 'framer-motion'
import Logo from './assets/airbnb-logo.svg'

function AssetForm (props) {
  return (
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
        <BinaryToggle updateForm={props.updateForm}></BinaryToggle>
      </div>
      <div className='grid-button bedrooms-capacity'>
        <p className='p-style'>Bedrooms</p>
        <RatingSelector
          type='bedrooms'
          updateForm={props.updateForm}
          value={props.listingAttributes.bedrooms}
          buttons={[<i class='fas fa-minus' />, <i class='fas fa-plus' />]}
        />
      </div>
      <div className='grid-button people-capacity'>
        <p>Guests</p>
        <RatingSelector
          type='person_capacity'
          updateForm={props.updateForm}
          value={props.listingAttributes.person_capacity}
          buttons={[<i class='fas fa-minus' />, <i class='fas fa-plus' />]}
        />
      </div>
      <div className='grid-button superhost'>
        <p>Superhost</p>
        <Toggle
          icon={'fa-regular fa-face-grin-stars fa-xl'}
          updateForm={props.updateForm}
          type='host_is_superhost'
        ></Toggle>
      </div>
      <div className='grid-button multi-listing'>
        <p>Multi-Listing</p>
        <Toggle
          icon={'fa-solid fa-list fa-xl'}
          updateForm={props.updateForm}
          type='multi'
        ></Toggle>
      </div>
      <div className='grid-button business-listing'>
        <p>Business-Listing</p>
        <Toggle
          icon={'fa-solid fa-user-tie fa-xl'}
          updateForm={props.updateForm}
          type='biz'
        ></Toggle>
      </div>
      <div className='grid-button city-list'>
        <p>City</p>
        <List
          cities={cities}
          setInitialViewState={props.setInitialViewState}
          getIconLayer={props.getIconLayer}
          setLayers={props.setLayers}
          setCityCenter={props.setCityCenter}
          updateForm={props.updateForm}
        ></List>
      </div>
      <div className='grid-button cleanliness'>
        <p>Cleanliness</p>
        <RatingSelector
          type='cleanliness_rating'
          value={props.listingAttributes.cleanliness_rating}
          updateForm={props.updateForm}
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
          updateForm={props.updateForm}
          value={props.listingAttributes.guest_satisfaction_overall}
          buttons={[
            <i class='fa-solid fa-caret-left' />,
            <i class='fa-solid fa-caret-right' />
          ]}
        />
      </div>
      <div
        onClick={() => props.handleSubmit()}
        className='grid-button calculate-rate'
      >
        Calculate Rate
      </div>
    </motion.div>
  )
}

export default AssetForm
