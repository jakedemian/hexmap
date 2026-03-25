import { GridProvider } from './state/GridContext'
import { HexCanvas } from './components/HexCanvas'
import { Toolbar } from './components/Toolbar'

function App() {
  return (
    <GridProvider>
      <div style={{ width: '100%', height: '100%', position: 'relative' }}>
        <HexCanvas />
        <Toolbar />
      </div>
    </GridProvider>
  )
}

export default App
