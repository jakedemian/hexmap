import { useState, useMemo } from 'react'
import { useGrid } from '../state/GridContext'
import { exportSparse, exportFull, downloadJson } from '../hex/export'
import { TileState } from '../hex/types'

export function Toolbar() {
  const { state, dispatch } = useGrid()
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [showClearConfirm, setShowClearConfirm] = useState(false)

  const darkCount = useMemo(() => {
    let count = 0
    for (const v of state.tiles.values()) {
      if (v === TileState.BLACK) count++
    }
    return count
  }, [state.tiles])

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

  const handleClear = () => {
    dispatch({ type: 'CLEAR_GRID' })
    setShowClearConfirm(false)
  }

  return (
    <>
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

        <button
          style={styles.button}
          onClick={() => setShowClearConfirm(true)}
        >
          Clear
        </button>

        <span style={styles.count}>
          {darkCount} dark {darkCount === 1 ? 'tile' : 'tiles'}
        </span>
      </div>

      {showClearConfirm && (
        <div style={styles.overlay} onClick={() => setShowClearConfirm(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <p style={styles.modalText}>
              Clear the entire map? This cannot be undone.
            </p>
            <div style={styles.modalButtons}>
              <button
                style={styles.button}
                onClick={() => setShowClearConfirm(false)}
              >
                Cancel
              </button>
              <button style={styles.dangerButton} onClick={handleClear}>
                Clear Map
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

const styles: Record<string, React.CSSProperties> = {
  toolbar: {
    position: 'absolute',
    top: 16,
    left: 16,
    display: 'flex',
    gap: 8,
    alignItems: 'center',
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
  count: {
    color: '#e8e8f0',
    fontSize: 14,
    fontFamily: 'inherit',
    padding: '8px 12px',
    background: '#1a1a30',
    border: '1px solid #555580',
    borderRadius: 6,
  },
  overlay: {
    position: 'fixed' as const,
    inset: 0,
    background: 'rgba(0, 0, 0, 0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  modal: {
    background: '#1e1e38',
    border: '1px solid #555580',
    borderRadius: 10,
    padding: '24px 28px',
    maxWidth: 360,
  },
  modalText: {
    color: '#e8e8f0',
    fontSize: 15,
    marginBottom: 20,
    lineHeight: 1.5,
  },
  modalButtons: {
    display: 'flex',
    gap: 10,
    justifyContent: 'flex-end',
  },
  dangerButton: {
    padding: '8px 16px',
    background: '#7a2a2a',
    color: '#e8e8f0',
    border: '1px solid #aa5555',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 14,
    fontFamily: 'inherit',
  },
}
