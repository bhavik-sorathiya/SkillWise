import { useState } from 'react'
import Landing from './Landing'
import Login from './Login'
import Signup from './Signup'
import CompanySignup from './CompanySignup'
import './App.css'

function App() {
  const [currentPage, setCurrentPage] = useState('landing')

  const renderPage = () => {
    switch (currentPage) {
      case 'login':
        return <Login onBackToHome={() => setCurrentPage('landing')} onNavigateToSignup={() => setCurrentPage('signup')} />
      case 'signup':
        return <Signup onBackToHome={() => setCurrentPage('landing')} onNavigateToLogin={() => setCurrentPage('login')} onNavigateToCompanySignup={() => setCurrentPage('company-signup')} />
      case 'company-signup':
        return <CompanySignup onBackToHome={() => setCurrentPage('landing')} onNavigateToLogin={() => setCurrentPage('login')} />
      case 'landing':
      default:
        return <Landing onNavigateToLogin={() => setCurrentPage('login')} />
    }
  }

  return renderPage()
}

export default App
