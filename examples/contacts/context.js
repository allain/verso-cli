console.time('generate context')
var contacts = []
for (var i = 1; i <= 10000; i++) {
  contacts.push({
    id: i,
    name: 'Contact ' + i
  })
}

module.exports = {
  contacts: contacts
}

console.timeEnd()
