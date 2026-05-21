import React from 'react'
import { useSelector } from 'react-redux'
import WelcomeUser from '../admin/partnerhub/components/WelcomeUser'
import DashboardCards from './cards/DashboardCards'

const Dashboardmain = () => {
  const { user } = useSelector((state) => state.auth);

  return (
    <div>
        <WelcomeUser/>

        {user?.role === 'admin' && (
          <div className='mt-6'>
              <DashboardCards/>
          </div>
        )}
       
    </div>
  )
}

export default Dashboardmain