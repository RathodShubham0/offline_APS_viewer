import './App.css';
import React from 'react';
import Viewer from './Viewer/Viewer';
import { Navbar } from './components/Navbar';
import Dashboard from './components/Dashboard';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

class App extends React.Component {
  constructor(props) {
    super(props);
    this.wrapper = null;

  }

  handleToggle = () => {
    if (this.wrapper) {
      this.wrapper.handleToggle();
    }
  };

  render() {
    return (
      <Router>
        <div>
        <div className="app">
        <Navbar handleToggle={this.handleToggle} />
      </div>
          <Routes>
            <Route path="/" element={<Viewer ref={ref => this.wrapper = ref} style={{ position: 'relative', width: '100%', height: '90vh' }} />} />
            <Route path="/dashboard" element={<Dashboard />} />
          </Routes>
        </div>
      </Router>
    );
    
  }
}

export default App;