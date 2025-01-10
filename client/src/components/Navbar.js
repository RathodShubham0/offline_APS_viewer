// src/components/Navbar.js
import React from 'react';
import './Navbar.css';

const Navbar = ({ handleToggle, downloadSvfBundle }) => {
  return (
    <nav className="navbar">
      <h4>Offline Viewer</h4>
      <div className="toggle-container">
        <label className="switch">
          <input type="checkbox" id="modelToggle" onChange={handleToggle} />
          <span className="slider round"></span>
          <div id="status">Model Offline</div>
        </label>
        <button onClick={downloadSvfBundle}>Download Svf Bundle</button>
      </div>
    </nav>
  );
};

export default Navbar;