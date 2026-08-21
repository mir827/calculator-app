import { useEffect, useReducer, useState } from 'react'
import './App.css'

const MAX_INPUT_DIGITS = 16
const HISTORY_KEY = 'calculator_history_v2'
const MAX_HISTORY_ITEMS = 50

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

const initialState = { displayValue: '0', storedValue: null, operator: null, waitingForOperand: false, error: '', lastCalculation: null }

function countDigits(value) { return value.replace(/[-.]/g, '').length }
function formatNumber(value) {
  if (!Number.isFinite(value)) return 'Error'
  const normalized = Object.is(value, -0) ? 0 : Number.parseFloat(value.toPrecision(12))
  const absoluteValue = Math.abs(normalized)
  if (absoluteValue !== 0 && (absoluteValue >= 1_000_000_000_000 || absoluteValue < 0.000001)) return normalized.toExponential(8).replace(/\.?0+e/, 'e')
  return normalized.toLocaleString('en-US', { maximumFractionDigits: 10, useGrouping: false })
}
function calculate(leftValue, operator, rightValue) {
  if (operator === '/' && rightValue === 0) return { error: 'Cannot divide by zero' }
  return { value: ({ '+': leftValue + rightValue, '-': leftValue - rightValue, '*': leftValue * rightValue, '/': leftValue / rightValue })[operator] }
}
function withCalculationError(message) { return { ...initialState, displayValue: message, error: message } }
function inputDigit(state, digit) {
  if (state.error) return { ...initialState, displayValue: digit }
  if (state.waitingForOperand) return { ...state, displayValue: digit, waitingForOperand: false }
  if (countDigits(state.displayValue) >= MAX_INPUT_DIGITS) return state
  if (state.displayValue === '0') return { ...state, displayValue: digit }
  if (state.displayValue === '-0') return { ...state, displayValue: `-${digit}` }
  return { ...state, displayValue: `${state.displayValue}${digit}` }
}
function inputDecimal(state) {
  if (state.error) return { ...initialState, displayValue: '0.' }
  if (state.waitingForOperand) return { ...state, displayValue: '0.', waitingForOperand: false }
  return state.displayValue.includes('.') ? state : { ...state, displayValue: `${state.displayValue}.` }
}
function chooseOperator(state, nextOperator) {
  if (state.error) return state
  if (state.operator && state.waitingForOperand) return { ...state, operator: nextOperator }
  const inputValue = Number(state.displayValue)
  if (state.storedValue === null) return { ...state, storedValue: inputValue, operator: nextOperator, waitingForOperand: true }
  const result = calculate(state.storedValue, state.operator, inputValue)
  if (result.error) return withCalculationError(result.error)
  return { ...state, displayValue: formatNumber(result.value), storedValue: result.value, operator: nextOperator, waitingForOperand: true }
}
function calculatorReducer(state, action) {
  switch (action.type) {
    case 'digit': return inputDigit(state, action.digit)
    case 'decimal': return inputDecimal(state)
    case 'operator': return chooseOperator(state, action.operator)
    case 'equals': {
      if (state.error || !state.operator || state.storedValue === null) return state
      const rightValue = state.waitingForOperand ? state.storedValue : Number(state.displayValue)
      const result = calculate(state.storedValue, state.operator, rightValue)
      if (result.error) return withCalculationError(result.error)
      const output = formatNumber(result.value)
      return { ...initialState, displayValue: output, waitingForOperand: true, lastCalculation: { id: crypto.randomUUID(), expression: `${formatNumber(state.storedValue)} ${OPERATORS[state.operator].symbol} ${formatNumber(rightValue)}`, result: output, leftValue: state.storedValue, operator: state.operator, rightValue, timestamp: Date.now() } }
    }
    case 'clear': return initialState
    case 'restore': return action.operator ? { ...initialState, displayValue: formatNumber(action.rightValue), storedValue: action.leftValue, operator: action.operator, waitingForOperand: false } : { ...initialState, displayValue: action.value, waitingForOperand: true }
    case 'backspace': {
      if (state.error) return initialState
      if (state.waitingForOperand) return state
      if (state.displayValue.length <= 1 || /^-\d$/.test(state.displayValue)) return { ...state, displayValue: '0' }
      return { ...state, displayValue: state.displayValue.slice(0, -1) }
    }
    case 'toggleSign': return state.error ? initialState : state.displayValue === '0' ? state : { ...state, displayValue: state.displayValue.startsWith('-') ? state.displayValue.slice(1) : `-${state.displayValue}`, waitingForOperand: false }
    case 'percent': return state.error ? initialState : { ...state, displayValue: formatNumber(Number(state.displayValue) / 100), waitingForOperand: false }
    default: return state
  }
}
function getButtonAction(button) { return button.type === 'digit' ? { type: 'digit', digit: button.digit } : button.type === 'operator' ? { type: 'operator', operator: button.operator } : { type: button.type } }
function getKeyboardAction(key) {
  if (/^\d$/.test(key)) return { type: 'digit', digit: key }
  if (key === '.') return { type: 'decimal' }
  if ('+-*/'.includes(key)) return { type: 'operator', operator: key }
  if (key === 'Enter' || key === '=') return { type: 'equals' }
  if (key === 'Escape') return { type: 'clear' }
  if (key === 'Backspace') return { type: 'backspace' }
  if (key === '%') return { type: 'percent' }
  return null
}
function loadHistory() { try { const saved = JSON.parse(localStorage.getItem(HISTORY_KEY)); return Array.isArray(saved) ? saved.slice(0, MAX_HISTORY_ITEMS) : [] } catch { return [] } }

function App() {
  const [state, dispatch] = useReducer(calculatorReducer, initialState)
  const [history, setHistory] = useState(loadHistory)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [copyStatus, setCopyStatus] = useState('')
  const activeOperator = state.operator ? OPERATORS[state.operator] : null
  const expressionValue = activeOperator && state.storedValue !== null ? `${formatNumber(state.storedValue)} ${activeOperator.symbol}` : ''
  const displayClassName = ['calculator__display', state.displayValue.length > 12 ? 'calculator__display--compact' : '', state.error ? 'calculator__display--error' : ''].filter(Boolean).join(' ')

  useEffect(() => {
    if (!state.lastCalculation) return
    setHistory((current) => {
      const next = [state.lastCalculation, ...current].slice(0, MAX_HISTORY_ITEMS)
      localStorage.setItem(HISTORY_KEY, JSON.stringify(next))
      return next
    })
  }, [state.lastCalculation])

  useEffect(() => {
    function handleKeyDown(event) {
      if ((event.key === 'Enter' || event.key === ' ') && event.target?.tagName === 'BUTTON') return
      const action = getKeyboardAction(event.key)
      if (!action) return
      event.preventDefault()
      dispatch(action)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  function clearHistory() { localStorage.removeItem(HISTORY_KEY); setHistory([]) }
  function selectHistory(item) { dispatch({ type: 'restore', value: item.result, leftValue: item.leftValue, operator: item.operator, rightValue: item.rightValue }); setHistoryOpen(false) }
  async function copyResult() {
    try {
      await navigator.clipboard.writeText(state.displayValue)
      setCopyStatus('Copied')
    } catch {
      const textArea = document.createElement('textarea')
      textArea.value = state.displayValue
      textArea.style.position = 'fixed'
      textArea.style.opacity = '0'
      document.body.appendChild(textArea)
      textArea.select()
      const copied = document.execCommand('copy')
      textArea.remove()
      setCopyStatus(copied ? 'Copied' : 'Copy failed')
    }
    window.setTimeout(() => setCopyStatus(''), 1600)
  }

  return <main className="calculator-page">
    <section className="calculator" aria-label="Calculator">
      <div className="calculator__header">
        <h1>Calculator</h1>
        <div className="calculator__header-actions">
          <button type="button" className="calculator__history-toggle" onClick={copyResult}>Copy</button>
          <button type="button" className="calculator__history-toggle" onClick={() => setHistoryOpen((open) => !open)} aria-expanded={historyOpen} aria-controls="calculation-history">History{history.length ? ` (${history.length})` : ''}</button>
          <div className="calculator__status" aria-hidden="true">{activeOperator?.label ?? 'Ready'}</div>
        </div>
      </div>
      <p className="calculator__copy-status" aria-live="polite">{copyStatus}</p>
      <div className="calculator__screen">
        <div className="calculator__expression" aria-hidden="true">{expressionValue || '\u00a0'}</div>
        <output className={displayClassName} aria-live="polite" aria-atomic="true">{state.displayValue}</output>
      </div>
      {historyOpen && <aside id="calculation-history" className="calculator__history" aria-label="Calculation history">
        <div className="calculator__history-header"><strong>History</strong>{history.length > 0 && <button type="button" onClick={clearHistory}>Clear all</button>}</div>
        {history.length ? <ul>{history.map((item) => <li key={item.id}><button type="button" onClick={() => selectHistory(item)}><span>{item.expression}</span><strong>= {item.result}</strong><time dateTime={new Date(item.timestamp).toISOString()}>{new Date(item.timestamp).toLocaleString()}</time></button></li>)}</ul> : <p>No calculations yet.</p>}
      </aside>}
      <div className="calculator__keypad">
        {BUTTONS.map((button) => {
          const isActiveOperator = button.type === 'operator' && button.operator === state.operator && state.waitingForOperand
          return <button type="button" key={button.label} className={`calculator__button calculator__button--${button.className}${isActiveOperator ? ' calculator__button--active' : ''}${button.wide ? ' calculator__button--wide' : ''}`} aria-label={button.label} aria-keyshortcuts={button.keyHint} onClick={() => dispatch(getButtonAction(button))}>{button.text}</button>
        })}
      </div>
    </section>
  </main>
}

export default App
