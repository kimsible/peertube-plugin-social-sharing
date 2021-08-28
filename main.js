const services = require('./assets/services.json')

async function register ({ registerSetting }) {
  for (const { label } of services) {
    registerSetting({
      name: label.toLowerCase(),
      label,
      type: 'input-checkbox',
      private: false
    })
  }
}

async function unregister () {}

module.exports = {
  register,
  unregister
}
