import React  from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
const root = ReactDOM.createRoot(document.getElementById('root'));

function RootComponent() {

    return   <App />;
}

root.render(<RootComponent />);

reportWebVitals();

// Register the service worker
// if ('serviceWorker' in navigator) {
//     window.addEventListener('load', () => {
//         navigator.serviceWorker.register('/serviceWorker.js')
//             .then(registration => {
//                 console.log('ServiceWorker registration successful with scope: ', registration.scope);
//             })
//             .catch(error => {
//                 console.log('ServiceWorker registration failed: ', error);
//             });
//     });
// }
