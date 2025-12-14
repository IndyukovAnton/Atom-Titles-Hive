import express from "express"
import CreateCollectionsHandlers from "../handlers/collections.handler.js";

const router = express.Router()

const CreateCollectionsRoute = (db)=> {
	const handlers = CreateCollectionsHandlers(db)

	router.get('/collections', handlers.getAll);
	router.post('/collections', handlers.createCollection)
	router.delete('/collections', handlers.deleteCollectionByID)

	// TODO: доделать создание записи и изменение

	return router
}

export default CreateCollectionsRoute;