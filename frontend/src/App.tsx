import { Routes, Route } from 'react-router-dom'
import Landing from './pages/Landing'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import PasswordRecovery from './pages/auth/PasswordRecovery'
import Home from './pages/Home'

function App() {
  return (
    <>
      <Routes>
        <Route path='/' element={<Landing/>} />
        <Route path='/auth/login' element={<Login/>} />
        <Route path='/auth/register' element={<Register/>} />
        <Route path='/auth/password-recovery' element={<PasswordRecovery/>} />
        <Route path='/home' element={<Home/>} />
      </Routes>
    </>
  )
}

export default App
