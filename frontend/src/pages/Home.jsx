import React, { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'

export default function Home() {
  const state = useSelector((s) => s.auth)
  const isAuthenticated = state?.isAuthenticated
  const nav = useNavigate()

  useEffect(() => {
    if (!isAuthenticated) {
      nav('/login')            
    }
  }, [isAuthenticated, nav])

  return (
    <div>
      No Wayyyyyyyyyyyyyy Home
    </div>
  )
}
