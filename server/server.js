import express from 'express'
import cors from 'cors';
import fileUpload from 'express-fileupload';
import { SETTINGS } from "./settings.js";
import CreateGroupsRoute from "./routes/groups.route.js";
import CreateCollectionsRoute from "./routes/collections.route.js";
import CreateDatabaseControllers from "./database/database.js";

const app = express();
const {port, paths} = SETTINGS;
const db = CreateDatabaseControllers();

const groupRoute = CreateGroupsRoute(db.groups)
const collectionsRoute = CreateCollectionsRoute(db.collections)


app.use(
	cors({
		origin: '*',
		credentials: true
	}),
	fileUpload({
		useTempFiles: false, // не использовать временные файлы
		debug: false
	})
);

// Routes

app.use('/api', groupRoute)
app.use('/api', collectionsRoute)

// Статические файлы
app.use(express.static(paths.static));


app.listen(port, () => {
	console.log(`✅ Сервер запущен на http://localhost:${port}`);
});