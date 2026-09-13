import { BrowserRouter } from 'react-router-dom'

import Layout from './components/Layout'
import { AuthProvider } from './contexts/AuthContext'
import Router from './Router'

import { FRONTEND_APP_BASENAME } from './consts/api'

function App() {
  return (
    <BrowserRouter basename={FRONTEND_APP_BASENAME}>
      <AuthProvider>
        <Layout>
          <Router />
        </Layout>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
