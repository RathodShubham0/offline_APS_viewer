import './App.css';
import React from 'react';
import Viewer from './Viewer/Viewer';
import { Navbar } from './components/Navbar';
import Dashboard from './components/Dashboard';

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
      <div className="app">
        <Dashboard />
        <Navbar handleToggle={this.handleToggle} />
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
          <Viewer ref={ref => this.wrapper = ref} />
        </div>
      </div>
    );
  }
}

export default App;