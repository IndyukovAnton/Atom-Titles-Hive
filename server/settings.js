export const PORT = 3000;

export const PATH = {
	static: 'public',
	collections: 'collections/collectionsData.json',
};

PATH.collectionsPath = path.join(path.static, path.collections)