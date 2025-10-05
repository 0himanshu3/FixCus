import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { store } from './redux/store.js'
import { Provider } from 'react-redux'
import 'leaflet/dist/leaflet.css';
createRoot(document.getElementById('root')).render(
 <Provider store={store}>
    <App />
    {/* <h1>Abcd</h1> */}
    </Provider>
)
