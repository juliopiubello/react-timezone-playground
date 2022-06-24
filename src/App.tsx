import React, {useState} from 'react';
import logo from './logo.svg';
import './App.css';
import TimezoneSelect from './TimeZone';

function App() {

  const [selectedTimezone, setSelectedTimezone] = useState({})

  return (
    <div>
      <header>
        <div>
        <TimezoneSelect
          //@ts-ignore
          value={selectedTimezone}
          onChange={setSelectedTimezone}
        />
        </div>
      </header>
    </div>
  );
}

export default App;
