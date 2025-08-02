import express from 'express'
import cors from 'cors';
import * as fs from 'node:fs';
import * as path from 'node:path';
import fileUpload from 'express-fileupload'; // ← добавлен

const app = express();
const PORT = 3000;
const DEBUG = true

const paths = {
	static: 'public',
	collections: 'data/collections.json',
	groups: 'data/groups.json',
	upload: 'uploads'
};

let collectionsPath;
let groupsPath;
let uploadPath;

if (DEBUG) {
	collectionsPath = path.join(paths.static, paths.collections);
	groupsPath = path.join(paths.static, paths.groups);
	uploadPath = path.join(paths.static, paths.upload);
} else {
	collectionsPath = path.join(paths.collections);
	groupsPath = path.join(paths.groups);
	uploadPath = path.join(paths.upload);
}


let collections = null;
let groups = null;

// ✅ Включаем CORS ДО всего
app.use(
	cors({
		origin: '*',
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

function getIDString() {
	
	const minLetter = 65
	const maxLetter = 80
	
	const countLetters = 6
	const letters = []

	for (let i = 0; i < countLetters; i++) {
		const letter = Math.random() * (maxLetter - minLetter) + minLetter
		letters.push(letter)
	}

	const code = String.fromCharCode(...letters)
	
	return code
}

// ✅ GET /collections
app.get('/collections', (req, res) => {
	if (!collections) {
		return res.status(200).json({});
	}
	res.json(collections);
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

app.delete('/groups', async (req, res) => {
	const { tag } = req.query;

	if (!tag) {
			return res.status(400).json({ error: 'Тег не указан' });
	}

	// Ищем группу
	const groupIndex = groups.findIndex(group => group.tag === tag);
	if (groupIndex === -1) {
			return res.status(404).json({ error: 'Группа не найдена' });
	}

	// Удаляем группу
	const removedGroup = groups.splice(groupIndex, 1)[0];

	// Обновляем все коллекции: если group === tag, ставим "undefined"
	let updatedCount = 0;
	collections = collections.map(item => {
			if (item.group === tag) {
					updatedCount++;
					return {
							...item,
							group: "undefined" // можно использовать null, "", или оставить строку "undefined"
					};
			}
			return item;
	});

	// Сохраняем обновлённые данные
	try {
			// Сохраняем обновлённые коллекции
			await fs.promises.writeFile(collectionsPath, JSON.stringify(collections, null, 2), 'utf8');
			// Сохраняем обновлённый список групп
			await fs.promises.writeFile(groupsPath, JSON.stringify(groups, null, 2), 'utf8');

			console.log(`✅ Группа "${tag}" удалена. Обновлено ${updatedCount} элементов.`);

			res.status(200).json({
					message: 'Группа удалена, привязки обновлены',
					tag: removedGroup.tag,
					collectionsUpdated: updatedCount
			});
	} catch (err) {
			console.error('❌ Ошибка при сохранении файлов:', err);
			res.status(500).json({ error: 'Не удалось сохранить данные после удаления группы' });
	}
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
		id: getIDString() + "_" + Date.now(),
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
		const fileName = `img_${newItem.id}${ext}`;
		const uploadDir = uploadPath;
		const imagePath = path.join(uploadDir, fileName);

		// Создаём папку uploads, если её нет
		if (!fs.existsSync(uploadDir)) {
			fs.mkdirSync(uploadDir, { recursive: true });
		}

		// Сохраняем файл
		try {
			await image.mv(imagePath);
			newItem.image = uploadPath + `/${fileName}`; // URL для фронтенда
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

// ✅ PATCH /collections
app.patch('/collections', (req, res) => {
	console.log('Обновление:', req.query, req.body);
	res.send('Изменение: ' + JSON.stringify(req.query));
});

// ✅ DELETE /collections
app.delete('/collections', async (req, res) => {
	const { id } = req.query;

	if (!id) {
			return res.status(400).json({ error: 'ID не указан' });
	}

	// Найти элемент по id
	const itemIndex = collections.findIndex(item => item.id === id);

	if (itemIndex === -1) {
			return res.status(404).json({ error: 'Элемент не найден' });
	}

	const itemToDelete = collections[itemIndex];

	// Удалить изображение с диска, если оно есть
	if (itemToDelete.image) {
			const imagePath = itemToDelete.image; // Путь к файлу

			console.log(imagePath)

			try {
					await fs.promises.unlink(imagePath);
					console.log(`🗑️ Изображение удалено: ${imagePath}`);
			} catch (err) {
					if (err.code !== 'ENOENT') {
							// Игнорируем ошибку, если файл не найден
							console.error('❌ Ошибка при удалении изображения:', err);
					}
			}
	}

	// Удалить элемент из массива
	collections.splice(itemIndex, 1);

	// Сохранить обновлённый массив в файл
	try {
			await fs.promises.writeFile(collectionsPath, JSON.stringify(collections, null, 2), 'utf8');
			console.log(`✅ Элемент с id=${id} удалён`);
			res.status(200).json({ message: 'Элемент успешно удалён', id });
	} catch (err) {
			console.error('❌ Ошибка при сохранении файла после удаления:', err);
			res.status(500).json({ error: 'Не удалось сохранить данные после удаления' });
	}
});

// ✅ Загружаем данные перед запуском сервера
await loadCollections()
await loadGroups()

app.listen(PORT, () => {
	console.log(`✅ Сервер запущен на http://localhost:${PORT}`);
});