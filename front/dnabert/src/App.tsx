import React, {useState} from 'react';
import logo from './logo.svg';
import './App.css';

function App() {

  const [bobId, setBobId] = useState(0);

  
  function sayHello() {
    fetch('http://localhost:3001/bobinfo').then(res => {
      res.json().then(parsed => {
          setBobId(parsed.id)
        })
      })
  }

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.tsx</code> and save to reload.
        </p>
        <button onClick={sayHello}>Get my documents</button>
        <p>
          Edit {bobId} and save to reload.
        </p>
      </header>
    </div>
  );
}

export default App;
