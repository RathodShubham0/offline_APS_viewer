// src/components/Navbar.js
import React from 'react';
import   SvfDownloader   from './SvfDownloader';
 

export function Navbar({handleToggle}){
  

  return (
    <div>
       <nav className="navbar">
        <h4 className=" min-letter-spacing pl-4" >APS Viewer</h4>
        <div className="toggle-container">
           <li>
             <a href="/ " className='p-2'>Home</a>
              <a href="/dashboard">Dashboard</a>
            </li>
          <button  id="status"  onClick={()=>{handleToggle();   }}    >Model: Online </button>
          <SvfDownloader/>
        </div>
      </nav>
 
    </div>
  );
}