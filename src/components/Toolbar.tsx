import { useState } from 'react'
import { useGrid } from '../state/GridContext'
import { exportSparse, exportFull, downloadJson } from '../hex/export'

export function Toolbar() {
  const { state, dispatch } = useGrid()
  const [showExportMenu, setShowExportMenu] = useState(false)

  const handleOrientationToggle = () => {
    dispatch({
      type: 'SET_ORIENTATION',
      orientation: state.orientation === 'pointy' ? 'flat' : 'pointy',
    })
  }

  const handleExportSparse = () => {
    const data = exportSparse(state.tiles)
    downloadJson(data, 'hexmap-sparse.json')
    setShowExportMenu(false)
  }

  const handleExportFull = () => {
    const data = exportFull(state.tiles)
    downloadJson(data, 'hexmap-full.json')
    setShowExportMenu(false)
  }

  return (
    <div style={styles.toolbar}>
      <button style={styles.button} onClick={handleOrientationToggle}>
        {state.orientation === 'pointy' ? 'Pointy Top' : 'Flat Top'}
      </button>

      <div style={styles.exportWrapper}>
        <button
          style={styles.button}
          onClick={() => setShowExportMenu(!showExportMenu)}
        >
          Export
        </button>

        {showExportMenu && (
          <div style={styles.dropdown}>
            <button style={styles.dropdownItem} onClick={handleExportFull}>
              Full Grid
            </button>
            <button style={styles.dropdownItem} onClick={handleExportSparse}>
              Black Tiles Only
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  toolbar: {
    position: 'absolute',
    top: 16,
    left: 16,
    display: 'flex',
    gap: 8,
    zIndex: 10,
  },
  button: {
    padding: '8px 16px',
    background: '#2a2a4e',
    color: '#e8e8f0',
    border: '1px solid #555580',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 14,
    fontFamily: 'inherit',
  },
  exportWrapper: {
    position: 'relative' as const,
  },
  dropdown: {
    position: 'absolute' as const,
    top: '100%',
    left: 0,
    marginTop: 4,
    background: '#2a2a4e',
    border: '1px solid #555580',
    borderRadius: 6,
    overflow: 'hidden',
    minWidth: 160,
  },
  dropdownItem: {
    display: 'block',
    width: '100%',
    padding: '8px 16px',
    background: 'none',
    color: '#e8e8f0',
    border: 'none',
    cursor: 'pointer',
    fontSize: 14,
    textAlign: 'left' as const,
    fontFamily: 'inherit',
  },
}
