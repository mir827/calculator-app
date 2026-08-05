import { useState } from 'react'
import './App.css'

function App() {
  const [display, setDisplay] = useState('0')
  const [firstOperand, setFirstOperand] = useState(null)
  const [operator, setOperator] = useState(null)
  const [waitingForSecondOperand, setWaitingForSecondOperand] = useState(false)

  const inputDigit = (digit) => {
    if (waitingForSecondOperand) {
      setDisplay(String(digit))
      setWaitingForSecondOperand(false)
    } else {
      setDisplay(display === '0' ? String(digit) : display + digit)
    }
  }

  const inputDecimal = () => {
    if (waitingForSecondOperand) {
      setDisplay('0.')
      setWaitingForSecondOperand(false)
    } else if (display.indexOf('.') === -1) {
      setDisplay(display + '.')
    }
  }

  const clearDisplay = () => {
    setDisplay('0')
    setFirstOperand(null)
    setOperator(null)
    setWaitingForSecondOperand(false)
  }

  const performOperation = (nextOperator) => {
    const { value: currentValue, sign } = display
    const inputValue = parseFloat(currentValue)

    if (firstOperand === null) {
      setFirstOperand(inputValue)
    } else if (operator) {
      const currentValue = firstOperand || 0
      let newValue = currentValue
      switch (operator) {
        case '+':
          newValue = currentValue + inputValue
          break
        case '-':
          newValue = currentValue - inputValue
          break
        case '×':
          newValue = currentValue * inputValue
          break
        case '÷':
          newValue = currentValue / inputValue
          break
        default:
          break
      }
      setDisplay(String(newValue))
      setFirstOperand(newValue)
    }

    setWaitingForSecondOperand(true)
    setOperator(nextOperator)
  }

  const calculate = () => {
    if (!operator || firstOperand === null) return
    const inputValue = parseFloat(display)
    const currentValue = firstOperand || 0
    let newValue = currentValue
    switch (operator) {
      case '+':
        newValue = currentValue + inputValue
        break
      case '-':
        newValue = currentValue - inputValue
        break
      case '×':
        newValue = currentValue * inputValue
        break
      case '÷':
        newValue = currentValue / inputValue
        break
      default:
        break
    }
    setDisplay(String(newValue))
    setFirstOperand(null)
    setWaitingForSecondOperand(true)
    setOperator(null)
  }

  const handleEquals = () => {
    calculate()
    setWaitingForSecondOperand(true)
    setOperator(null)
    setFirstOperand(null)
  }

  const handleClear = () => {
    clearDisplay()
  }

  const handleToggleSign = () => {
    setDisplay(String(parseFloat(display) * -1))
  }

  const handlePercent = () => {
    setDisplay(String(parseFloat(display) / 100))
  }

  const handleDecimal = () => {
    inputDecimal()
  }

  const buttonStyle = {
    flex: '1 0 40px',
    height: '100%',
    fontSize: '24px',
    cursor: 'pointer',
    border: '1px solid #ccc',
    borderRadius: '4px',
    backgroundColor: '#f9f9f9',
    transition: 'background-color 0.2s',
  }

  const buttonStyleActive = {
    ...buttonStyle,
    backgroundColor: '#e0e0e0',
  }

  const buttonOperatorStyle = {
    ...buttonStyle,
    backgroundColor: '#ff9500',
    color: 'white',
  }

  const buttonACStyle = {
    ...buttonStyle,
    backgroundColor: '#ff3b30',
    color: 'white',
  }

  return (
    <div className="calculator">
      <div className="display-container">
        <div className="display">
          {display.length > 9 ? display.slice(-9) : display}
        </div>
      </div>
      <div className="buttons">
        <button onClick={handleClear} className={buttonACStyle}>AC</button>
        <button onClick={handleToggleSign} className={buttonStyle}>+/-</button>
        <button onClick={handlePercent} className={buttonStyle}>%</button>
        <button onClick={() => performOperation('÷')} className={buttonOperatorStyle}>÷</button>
        <button onClick={() => inputDigit(7)} className={buttonStyle}>7</button>
        <button onClick={() => inputDigit(8)} className={buttonStyle}>8</button>
        <button onClick={() => inputDigit(9)} className={buttonStyle}>9</button>
        <button onClick={() => performOperation('×')} className={buttonOperatorStyle}>×</button>
        <button onClick={() => inputDigit(4)} className={buttonStyle}>4</button>
        <button onClick={() => inputDigit(5)} className={buttonStyle}>5</button>
        <button onClick={() => inputDigit(6)} className={buttonStyle}>6</button>
        <button onClick={() => performOperation('-')} className={buttonOperatorStyle}>-</button>
        <button onClick={() => inputDigit(1)} className={buttonStyle}>1</button>
        <button onClick={() => inputDigit(2)} className={buttonStyle}>2</button>
        <button onClick={() => inputDigit(3)} className={buttonStyle}>3</button>
        <button onClick={() => performOperation('+')} className={buttonOperatorStyle}>+</button>
        <button onClick={() => inputDigit(0)} className={buttonStyle}>0</button>
        <button onClick={handleDecimal} className={buttonStyle}>.</button>
        <button onClick={() => inputDigit(0)} className={buttonStyle}>00</button>
        <button onClick={handleEquals} className={buttonOperatorStyle}>=</button>
      </div>
    </div>
  )
}

export default App
