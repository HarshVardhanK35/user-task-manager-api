const { calculateTip, fahrenheitToCelsius, celsiusToFahrenheit, add } = require('./math')

test('should calculate total with tip', () => {
  const checkTotal = calculateTip(10, 0.3)
  expect(checkTotal).toBe(13)
})

test('should calculate total with default tip', () => {
  const checkTotal = calculateTip(10)
  expect(checkTotal).toBe(12)
})

test('should calculate celsius from fahrenheit', () => {
  const checkTemp = fahrenheitToCelsius(32)
  expect(checkTemp).toBe(0)

})

test('should calculate fahrenheit from celsius', () => {
  const checkTemp = celsiusToFahrenheit(0)
  expect(checkTemp).toBe(32)
})

// ------------------- asynchronous-code -------------------
test('testing async- Demo', (executed)=>{
  setTimeout(()=>{
    expect(1).toBe(1)
    executed()
  }, 2000)
})

// ------------------- testing promises -------------------
// 1. using parameters
test('Should add two numbers!', (executed) => {
  add(2, 3)
  .then((sum) => {
    expect(sum).toBe(5)
    executed()
  })
})

// 2. using async/await
test('should add two numbers - async/await', async () => {
  const sum = await add(2, 3)
  expect(sum).toBe(5)
})