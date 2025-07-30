export async function loadCollections() {
	try {
		const data = await fs.promises.readFile(collectionsPath, 'utf8');
		collections = JSON.parse(data);
		console.log('✅ Данные загружены');
	} catch (err) {
		console.error('❌ Ошибка загрузки collections:', err);
		collections = []; // или пустой массив
	}
}