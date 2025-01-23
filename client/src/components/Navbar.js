// src/components/Navbar.js
import React from 'react';
 
 

export function Navbar({handleToggle}){
  

  return (
    <div>
       <nav className="navbar">
        <h4 className=" min-letter-spacing pl-4" >APS Viewer</h4>
        <div className="toggle-container">
           <li>
            
              <a style={{color: 'white'}}  className=" min-letter-spacing pr-4" href="/">Dashboard</a>
            </li>
          <button  id="status"  onClick={()=>{handleToggle();   }}    >Model: Online </button>
          
        </div>
      </nav>
 
    </div>
  );
}