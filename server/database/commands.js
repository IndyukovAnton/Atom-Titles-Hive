export function createTableGroups() {
	return `
		CREATE TABLE IF NOT EXISTS groups (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			title TEXT NOT NULL UNIQUE,
			tag VARCHAR(20) NOT NULL UNIQUE
		);
	`;
}

export function createTableCollections() {
	return `
		CREATE TABLE IF NOT EXISTS collections (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			title TEXT NOT NULL,
			description TEXT,
			rating TINYINT CHECK (rating BETWEEN 1 AND 10),
			tag VARCHAR(20),
			image Text DEFAULT NULL,
			FOREIGN KEY (tag) REFERENCES groups(tag) ON DELETE SET NULL
		);
	`;
}