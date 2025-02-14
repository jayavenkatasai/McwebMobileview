import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import VendorChatApp from './components/VendorChatApp'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <VendorChatApp></VendorChatApp>
    </>
  )
}

export default App
