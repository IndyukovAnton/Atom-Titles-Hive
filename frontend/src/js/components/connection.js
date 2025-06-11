export default class Connection {
	constructor(url, headers) {
		this.URL = url
		this.HEADERS = headers
	}

	async check_connection() {
		const response = fetch(url+"/check")

		return (await response).status
	}

	async get_groups() {
		return "Groups"
	}

	async get_collections(groups) {
		return "collections"
	}

	async get_user(login, password) {
		return `Login: ${login}; Password: ${password}`
	}

	async check_user(login, password) {
		return false
	}
}