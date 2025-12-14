import express from "express"
import CreateGroupsHandlers from "../handlers/groups.handler.js";

const router = express.Router()

const CreateGroupsRoute = (db)=> {
	const handlers = CreateGroupsHandlers(db)

	router.get('/groups', handlers.getAll);

	// TODO: Сделать создание группы, удаление и изменение

	return router
}

export default CreateGroupsRoute;