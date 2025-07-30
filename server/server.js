import express from 'express';
import cors from 'cors';
import * as fs from 'node:fs';
import * as path from 'node:path';
import fileUpload from 'express-fileupload'; // ← добавлен

const app = express();
const PORT = 3000;

const paths = {
	static: 'public',
	collections: 'data/collections.json',
	groups: 'data/groups.json',
};

const collectionsPath = path.join(paths.static, paths.collections);
const groupsPath = path.join(paths.static, paths.groups);

let collections = null;
let groups = null;

// ✅ Включаем CORS ДО всего
app.use(
	cors({
		origin: 'http://localhost:5173',
		credentials: true
	})
);

// ✅ Заменяем express.json() на fileUpload для работы с FormData
app.use(fileUpload({
	useTempFiles: false, // не использовать временные файлы
	debug: false
}));

// ✅ Статические файлы
app.use(express.static(paths.static));

// ✅ Асинхронная загрузка данных при старте
async function loadCollections() {
	try {
		const data = await fs.promises.readFile(collectionsPath, 'utf8');
		collections = JSON.parse(data);
		console.log('✅ Данные "коллекции" загружены');
	} catch (err) {
		console.error('❌ Ошибка загрузки collections:', err);
		collections = [];
	}
}

async function loadGroups() {
	try {
		const data = await fs.promises.readFile(groupsPath, 'utf8');
		groups = JSON.parse(data);
		console.log('✅ Данные "группы" загружены');
	} catch (err) {
		console.error('❌ Ошибка загрузки groups:', err);
		groups = [];
	}
}

// ✅ GET /collections
app.get('/collections', (req, res) => {
	if (!collections) {
		return res.status(200).json({});
	}
	res.json(collections);
});

app.post('/collections', async (req, res) => {
	const { group, title, description, rating, 'date-start': dateStart, 'date-end': dateEnd } = req.body;
	const image = req.files?.image; // файл из формы

	// 🔹 Проверка обязательных полей
	if (!title || !description || !rating) {
		return res.status(400).json({ error: 'Не все поля заполнены' });
	}

	// 🔹 Формируем новый элемент
	const newItem = {
		id: Date.now(),
		group,
		title,
		description,
		rating: Number(rating),
		dateStart: dateStart || null,
		dateEnd: dateEnd || null,
		image: null
	};

	// 🔹 Если загружено изображение
	if (image) {
		const ext = path.extname(image.name);
		const fileName = `img_${Date.now()}${ext}`;
		const uploadDir = path.join(paths.static, 'uploads');
		const imagePath = path.join(uploadDir, fileName);

		// Создаём папку uploads, если её нет
		if (!fs.existsSync(uploadDir)) {
			fs.mkdirSync(uploadDir, { recursive: true });
		}

		// Сохраняем файл
		try {
			await image.mv(imagePath);
			newItem.image = `/uploads/${fileName}`; // URL для фронтенда
		} catch (err) {
			console.error('❌ Ошибка сохранения изображения:', err);
			return res.status(500).json({ error: 'Не удалось сохранить изображение' });
		}
	}

	// 🔹 Добавляем в коллекцию
	collections.push(newItem);

	// 🔹 Сохраняем в файл
	try {
		await fs.promises.writeFile(collectionsPath, JSON.stringify(collections, null, 2), 'utf8');
		console.log('✅ Элемент добавлен и сохранён');
		res.status(201).json({ message: 'Элемент добавлен', item: newItem });
	} catch (err) {
		console.error('❌ Ошибка записи файла:', err);
		res.status(500).json({ error: 'Не удалось сохранить данные' });
	}
});

app.get('/groups', (req, res) => {
	if (!groups) {
		return res.status(200).json({});
	}
	res.json(groups);
});

app.post('/groups', async (req, res) => {
	const { title, tag } = req.body;

	if (!title || !tag) {
		return res.status(400).json({ error: 'Не все поля заполнены' });
	}

	// 🔹 Формируем новый элемент
	const newItem = {
		title,
		tag
	};

	

	if (!fs.existsSync(groupsPath)) {
		fs.mkdirSync(groupsPath, { recursive: true });
	}

	// 🔹 Добавляем в коллекцию
	groups.push(newItem);

	// 🔹 Сохраняем в файл
	try {
		await fs.promises.writeFile(groupsPath, JSON.stringify(groups, null, 2), 'utf8');
		console.log('✅ Группа добавлена и сохранена');
		res.status(201).json({ message: 'Группа добавлена', item: newItem });
	} catch (err) {
		console.error('❌ Ошибка записи файла:', err);
		res.status(500).json({ error: 'Не удалось сохранить данные' });
	}
});

// ✅ PUT /collections
app.put('/collections', (req, res) => {
	console.log('Обновление:', req.query, req.body);
	res.send('Изменение: ' + JSON.stringify(req.query));
});

// ✅ DELETE /collections
app.delete('/collections', (req, res) => {
	if (req.query.id) {
		console.log('Удаление ID:', req.query.id);
		res.send('Удаление: ' + req.query.id);
	} else {
		res.status(400).json({ error: 'ID не указан' });
	}
});

// ✅ Загружаем данные перед запуском сервера
await loadCollections()
await loadGroups()

app.listen(PORT, () => {
	console.log(`✅ Сервер запущен на http://localhost:${PORT}`);
});