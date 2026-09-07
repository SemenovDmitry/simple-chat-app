import { BrowserRouter } from 'react-router-dom'

import Layout from './components/Layout'
import { AuthProvider } from './contexts/AuthContext'
import Router from './Router'

function App() {
  return (
    <BrowserRouter basename='/simple-chat-app/'>
      <AuthProvider>
        <Layout>
          <Router />
        </Layout>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
