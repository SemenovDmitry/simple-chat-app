import { Routes, Route } from 'react-router-dom'

import PrivateRoute from './components/PrivateRoute'
import Home from './pages/Home'
import About from './pages/About'
import Login from './pages/Login'
import VerifyToken from './pages/VerifyToken'
import Profile from './pages/Profile'

function Router() {
  return (
    <Routes>
      <Route element={<PrivateRoute />}>
        <Route path='/' element={<Home />} />
      </Route>
      <Route path='/profile' element={<Profile />} />
      <Route path='/about' element={<About />} />
      <Route path='/login' element={<Login />} />
      <Route path='/auth/callback' element={<VerifyToken />} />
    </Routes>
  )
}

export default Router
