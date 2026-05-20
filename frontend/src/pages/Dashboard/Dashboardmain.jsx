import React from 'react'
import WelcomeUser from '../admin/partnerhub/components/WelcomeUser'
import DashboardCards from './cards/DashboardCards'

const Dashboardmain = () => {
  return (
    <div>
        <WelcomeUser/>

        <div className='mt-6'>
            <DashboardCards/>
        </div>
       
    </div>
  )
}

export default Dashboardmain