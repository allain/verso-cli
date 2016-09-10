module.exports = {
	'/' : {
		render: (contacts) => {
			return `<ul>${contacts.map(contact => {
				let {id,name} = contact
				return `<li><a href="/contact/${id}">${name}</a></li>`
			}).join('')}</ul>`.replace(/>\s*</g, '><')
		}
	},

	'/contact/:id': (id, contacts) => {
		let contact = contacts.find(c => c.id == id)
		return `<div>
      <div><a href="/">Home</a></div>
			<h1>${contact.name}'s Page</h1>
		</div>`.replace(/>\s*</g, '><')
	}
}