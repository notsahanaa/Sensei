import { forwardRef } from 'react'
import ReactDatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import './DatePicker.css'

const DatePicker = ({ selected, onChange, ...props }) => {
  return (
    <ReactDatePicker
      selected={selected}
      onChange={onChange}
      dateFormat="MMM d, yyyy"
      calendarClassName="custom-calendar"
      wrapperClassName="date-picker-wrapper"
      popperClassName="date-picker-popper"
      {...props}
    />
  )
}

export default DatePicker
