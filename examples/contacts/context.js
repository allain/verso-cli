var contacts = {}
for (var i = 1; i <= 10000; i++) {
  contacts[i] = {
    id: i,
    name: 'Contact ' + i
  }
}

module.exports = {
  contacts: contacts
}
