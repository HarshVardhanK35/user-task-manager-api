const calculateTip = (bill, tipPercent = 0.2) => {
  const total = bill * tipPercent
  return bill + total;
}

const fahrenheitToCelsius = (temp) => {
  return (temp - 32) / 1.8
}

const celsiusToFahrenheit = (temp) => {
  return (temp * 1.8) + 32
}

const add = (a, b) => {
  return new Promise((res, rej) => {
    setTimeout(() => {
      if(a < 0 || b < 0) {
        return rej("Numbers must be positive")
      }
      res(a + b)
    }, 2000)
  })
}

module.exports = {
  calculateTip,
  fahrenheitToCelsius,
  celsiusToFahrenheit,
  add
}