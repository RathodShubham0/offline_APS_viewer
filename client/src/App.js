import './App.css';
import React from 'react';
import Viewer from './Viewer/Viewer';
import svfd from  '../src/components/svfd';
class App extends React.Component {
  constructor(props) {
    super(props);
    this.wrapper = null;

  }

  render() {
     
    return (
      <div className="app">
        <svfd/>
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
          <Viewer
            ref={ref => this.wrapper = ref}
          />

        </div>
      </div>
    );
  }
}

export default App;