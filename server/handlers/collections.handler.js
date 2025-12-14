const CreateCollectionsHandlers = (db)=> {
	async function getAll(req, res) {
		const data = db.getAllCollections()

		res.json(data)
	}

	async function createCollection(req, res) {
		const collectionData = req.body

		console.log(collectionData)

		// const result = db.createCollection(collectionData)
	}

	async function deleteCollectionByID(req, res) {
		const collectionID = req.query.id
		const result = db.deleteCollectionByID(collectionID)

		if (result.changes !== 0) {
			res.status(200).json({'status': true, 'result': result})
		} else {
			res.status(404).json({'status': true, 'result': result})
		}
	}

	return {
		getAll,
		createCollection,
		deleteCollectionByID
	}
}

export default CreateCollectionsHandlers;