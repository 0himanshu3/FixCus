import React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Navigate } from 'react-router-dom'
import { logout } from '../redux/slices/authSlice'
import Header from '../components/Header'
 // Adjust the path as needed

function Home() {

    const state = useSelector((state) => state.auth)
    const dispatch = useDispatch()

    const handleLogout = () => {
        dispatch(logout())
    }

    if (!state.isAuthenticated) {
        return <Navigate to="/login" />
    }

    return (
        <>
        </>
        
    )
}

export default Home