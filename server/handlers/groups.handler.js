const CreateGroupsHandlers = (db)=> {
	async function getAll(req, res) {
		const defaultGroup = {'id': 0, 'title': 'Неопределно', 'tag': 'null'}

		const data = [defaultGroup, ...db.getAllGroups()]
		
		res.json(data)
	}

	return {
		getAll
	}
}

export default CreateGroupsHandlers;