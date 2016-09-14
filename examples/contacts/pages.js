module.exports = {
	'/' : {
		render: (contacts) => {
		  let contactsHtml = Object.keys(contacts).map(id => {
				let {name} = contacts[id]
				return `<li><a href="/contact/${id}">${name}</a></li>`
			}).join('')

			return `<ul>${contactsHtml}</ul>`.replace(/>\s*</g, '><')
		},

		customize: (el) => {
			console.log(el.querySelectorAll('li'))
		}
	},

	'/contact/:id': (id, contacts) => {
		return `<div>
      <div><a href="/">Home</a></div>
			<h1>${contacts[id].name}'s Page</h1>
		</div>`.replace(/>\s*</g, '><')
	}
}
