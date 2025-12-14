import path from "node:path";
import { fileURLToPath } from "node:url";

// Получаем путь к текущему файлу
const __filename = fileURLToPath(import.meta.url);
// Получаем директорию текущего файла (server/)
const __dirname = path.dirname(__filename);
// Поднимаемся на уровень выше, чтобы попасть в корень проекта
const projectRoot = path.resolve(__dirname, '../..');
// Путь к базе данных в корне проекта: /data/db.sqlite
const dbPath = path.join(projectRoot, 'data', 'db.sqlite');

import { createTableGroups, createTableCollections} from "./commands.js";

import Database from 'better-sqlite3';
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.exec("PRAGMA foreign_keys = ON;");

// INIT
db.exec(createTableGroups())
db.exec(createTableCollections())


function initTestDataGroups() {
	const insert = db.prepare('INSERT INTO groups (title, tag) VALUES (@title, @tag)');

	const insertMany = db.transaction((items) => {
		for (const item of items) insert.run(item);
	});

	insertMany([
		{"title": "Фильмы", "tag": "films"},
		{"title": "Сериалы", "tag": "serials"},
	])
}

function initTestDataCollections() {
  const insert = db.prepare('INSERT INTO collections (title, description, rating, tag) VALUES (@title, @description, @rating, @tag)');

  const insertMany = db.transaction((items) => {
    for (const item of items) insert.run(item);
  });

  // Предположим, что у вас уже есть:
  // - группа "Фильмы" с id = 1
  // - группа "Сериалы" с id = 2

  insertMany([
    { title: "Фильм 1", description: "пойдёт многого я и не ждал", rating: 5, tag: "films", image: null},
    { title: "Фильм 2", description: "пойдёт многого я и не ждал", rating: 5, tag: "films", image: null},
    { title: "Фильм 3", description: "пойдёт многого я и не ждал", rating: 5, tag: "films", image: null},
    { title: "Фильм 4", description: "пойдёт многого я и не ждал", rating: 5, tag: null, image: null},
    { title: "Сериал 1", description: "пойдёт многого я и не ждал", rating: 7, tag: "serials", image: null},
    { title: "Сериал 2", description: "пойдёт многого я и не ждал", rating: 2, tag: "serials", image: null},
    { title: "Сериал 3", description: "пойдёт многого я и не ждал", rating: 1, tag: null, image: null},
  ]);
}
// initTestDataGroups()
// initTestDataCollections()

const CreateDatabaseControllers = ()=> {
	function getAllGroups() {
		return db.prepare('SELECT * FROM groups').all();
	}

	function getAllCollections() {
		return db.prepare('SELECT * FROM collections').all();
	}

	function deleteCollectionByID(id) {
		return db.prepare('DELETE FROM collections WHERE id = ?').run(id);
	}

	return {
		"groups": {
			getAllGroups
		},
		"collections": {
			getAllCollections,
			deleteCollectionByID
		}
	}
}

export default CreateDatabaseControllers;