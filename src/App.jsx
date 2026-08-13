import { useEffect, useReducer } from 'react'
import './App.css'

const MAX_INPUT_DIGITS = 16

const OPERATORS = {
  '+': { symbol: '+', label: 'Add' },
  '-': { symbol: '−', label: 'Subtract' },
  '*': { symbol: '×', label: 'Multiply' },
  '/': { symbol: '÷', label: 'Divide' },
}

const BUTTONS = [
  { label: 'All clear', text: 'AC', type: 'clear', className: 'function', keyHint: 'Escape' },
  { label: 'Toggle sign', text: '+/−', type: 'toggleSign', className: 'function' },
  { label: 'Percent', text: '%', type: 'percent', className: 'function', keyHint: '%' },
  { label: 'Divide', text: '÷', type: 'operator', operator: '/', className: 'operator', keyHint: '/' },
  { label: 'Seven', text: '7', type: 'digit', digit: '7', className: 'number', keyHint: '7' },
  { label: 'Eight', text: '8', type: 'digit', digit: '8', className: 'number', keyHint: '8' },
  { label: 'Nine', text: '9', type: 'digit', digit: '9', className: 'number', keyHint: '9' },
  { label: 'Multiply', text: '×', type: 'operator', operator: '*', className: 'operator', keyHint: '*' },
  { label: 'Four', text: '4', type: 'digit', digit: '4', className: 'number', keyHint: '4' },
  { label: 'Five', text: '5', type: 'digit', digit: '5', className: 'number', keyHint: '5' },
  { label: 'Six', text: '6', type: 'digit', digit: '6', className: 'number', keyHint: '6' },
  { label: 'Subtract', text: '−', type: 'operator', operator: '-', className: 'operator', keyHint: '-' },
  { label: 'One', text: '1', type: 'digit', digit: '1', className: 'number', keyHint: '1' },
  { label: 'Two', text: '2', type: 'digit', digit: '2', className: 'number', keyHint: '2' },
  { label: 'Three', text: '3', type: 'digit', digit: '3', className: 'number', keyHint: '3' },
  { label: 'Add', text: '+', type: 'operator', operator: '+', className: 'operator', keyHint: '+' },
  { label: 'Zero', text: '0', type: 'digit', digit: '0', className: 'number', keyHint: '0', wide: true },
  { label: 'Decimal point', text: '.', type: 'decimal', className: 'number', keyHint: '.' },
  { label: 'Equals', text: '=', type: 'equals', className: 'equals', keyHint: 'Enter' },
]

const initialState = {
  displayValue: '0',
  storedValue: null,
  operator: null,
  waitingForOperand: false,
  error: '',
}

function countDigits(value) {
  return value.replace(/[-.]/g, '').length
}

function formatNumber(value) {
  if (!Number.isFinite(value)) {
    return 'Error'
  }

  const normalized = Object.is(value, -0) ? 0 : Number.parseFloat(value.toPrecision(12))
  const absoluteValue = Math.abs(normalized)

  if (absoluteValue !== 0 && (absoluteValue >= 1_000_000_000_000 || absoluteValue < 0.000001)) {
    return normalized.toExponential(8).replace(/\.?0+e/, 'e')
  }

  return normalized.toLocaleString('en-US', {
    maximumFractionDigits: 10,
    useGrouping: false,
  })
}

function calculate(leftValue, operator, rightValue) {
  if (operator === '/' && rightValue === 0) {
    return { error: 'Cannot divide by zero' }
  }

  const operations = {
    '+': leftValue + rightValue,
    '-': leftValue - rightValue,
    '*': leftValue * rightValue,
    '/': leftValue / rightValue,
  }

  return { value: operations[operator] }
}

function withCalculationError(message) {
  return {
    ...initialState,
    displayValue: message,
    error: message,
  }
}

function inputDigit(state, digit) {
  if (state.error) {
    return { ...initialState, displayValue: digit }
  }

  if (state.waitingForOperand) {
    return { ...state, displayValue: digit, waitingForOperand: false }
  }

  if (countDigits(state.displayValue) >= MAX_INPUT_DIGITS) {
    return state
  }

  if (state.displayValue === '0') {
    return { ...state, displayValue: digit }
  }

  if (state.displayValue === '-0') {
    return { ...state, displayValue: `-${digit}` }
  }

  return { ...state, displayValue: `${state.displayValue}${digit}` }
}

function inputDecimal(state) {
  if (state.error) {
    return { ...initialState, displayValue: '0.' }
  }

  if (state.waitingForOperand) {
    return { ...state, displayValue: '0.', waitingForOperand: false }
  }

  if (state.displayValue.includes('.')) {
    return state
  }

  return { ...state, displayValue: `${state.displayValue}.` }
}

function chooseOperator(state, nextOperator) {
  if (state.error) {
    return state
  }

  if (state.operator && state.waitingForOperand) {
    return { ...state, operator: nextOperator }
  }

  const inputValue = Number(state.displayValue)

  if (state.storedValue === null) {
    return {
      ...state,
      storedValue: inputValue,
      operator: nextOperator,
      waitingForOperand: true,
    }
  }

  const result = calculate(state.storedValue, state.operator, inputValue)

  if (result.error) {
    return withCalculationError(result.error)
  }

  return {
    ...state,
    displayValue: formatNumber(result.value),
    storedValue: result.value,
    operator: nextOperator,
    waitingForOperand: true,
  }
}

function calculatorReducer(state, action) {
  switch (action.type) {
    case 'digit':
      return inputDigit(state, action.digit)

    case 'decimal':
      return inputDecimal(state)

    case 'operator':
      return chooseOperator(state, action.operator)

    case 'equals': {
      if (state.error || !state.operator || state.storedValue === null) {
        return state
      }

      const rightValue = state.waitingForOperand ? state.storedValue : Number(state.displayValue)
      const result = calculate(state.storedValue, state.operator, rightValue)

      if (result.error) {
        return withCalculationError(result.error)
      }

      return {
        ...initialState,
        displayValue: formatNumber(result.value),
        waitingForOperand: true,
      }
    }

    case 'clear':
      return initialState

    case 'backspace': {
      if (state.error) {
        return initialState
      }

      if (state.waitingForOperand) {
        return state
      }

      if (state.displayValue.length <= 1 || /^-\d$/.test(state.displayValue)) {
        return { ...state, displayValue: '0' }
      }

      return { ...state, displayValue: state.displayValue.slice(0, -1) }
    }

    case 'toggleSign': {
      if (state.error || state.displayValue === '0') {
        return state.error ? initialState : state
      }

      return {
        ...state,
        displayValue: state.displayValue.startsWith('-')
          ? state.displayValue.slice(1)
          : `-${state.displayValue}`,
        waitingForOperand: false,
      }
    }

    case 'percent': {
      if (state.error) {
        return initialState
      }

      return {
        ...state,
        displayValue: formatNumber(Number(state.displayValue) / 100),
        waitingForOperand: false,
      }
    }

    default:
      return state
  }
}

function getButtonAction(button) {
  if (button.type === 'digit') {
    return { type: 'digit', digit: button.digit }
  }

  if (button.type === 'operator') {
    return { type: 'operator', operator: button.operator }
  }

  return { type: button.type }
}

function getKeyboardAction(key) {
  if (/^\d$/.test(key)) {
    return { type: 'digit', digit: key }
  }

  if (key === '.') {
    return { type: 'decimal' }
  }

  if (key === '+' || key === '-' || key === '*' || key === '/') {
    return { type: 'operator', operator: key }
  }

  if (key === 'Enter' || key === '=') {
    return { type: 'equals' }
  }

  if (key === 'Escape') {
    return { type: 'clear' }
  }

  if (key === 'Backspace') {
    return { type: 'backspace' }
  }

  if (key === '%') {
    return { type: 'percent' }
  }

  return null
}

function App() {
  const [state, dispatch] = useReducer(calculatorReducer, initialState)
  const activeOperator = state.operator ? OPERATORS[state.operator] : null
  const expressionValue =
    activeOperator && state.storedValue !== null
      ? `${formatNumber(state.storedValue)} ${activeOperator.symbol}`
      : ''
  const displayClassName = [
    'calculator__display',
    state.displayValue.length > 12 ? 'calculator__display--compact' : '',
    state.error ? 'calculator__display--error' : '',
  ]
    .filter(Boolean)
    .join(' ')

  useEffect(() => {
    function handleKeyDown(event) {
      if ((event.key === 'Enter' || event.key === ' ') && event.target?.tagName === 'BUTTON') {
        return
      }

      const action = getKeyboardAction(event.key)

      if (!action) {
        return
      }

      event.preventDefault()
      dispatch(action)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <main className="calculator-page">
      <section className="calculator" aria-label="Calculator">
        <div className="calculator__header">
          <h1>Calculator</h1>
          <div className="calculator__status" aria-hidden="true">
            {activeOperator?.label ?? 'Ready'}
          </div>
        </div>

        <div className="calculator__screen">
          <div className="calculator__expression" aria-hidden="true">
            {expressionValue || '\u00a0'}
          </div>
          <output className={displayClassName} aria-live="polite" aria-atomic="true">
            {state.displayValue}
          </output>
        </div>

        <div className="calculator__keypad">
          {BUTTONS.map((button) => {
            const isActiveOperator =
              button.type === 'operator' &&
              button.operator === state.operator &&
              state.waitingForOperand

            return (
              <button
                type="button"
                key={button.label}
                className={`calculator__button calculator__button--${button.className}${
                  isActiveOperator ? ' calculator__button--active' : ''
                }${button.wide ? ' calculator__button--wide' : ''}`}
                aria-label={button.label}
                aria-keyshortcuts={button.keyHint}
                onClick={() => dispatch(getButtonAction(button))}
              >
                {button.text}
              </button>
            )
          })}
        </div>
      </section>
    </main>
  )
}

export default App
