import type { ICollection } from "@/types/collections.interface";

const baseURL = "http://127.0.0.1:3000/"

interface IGetApiCollections {
	onLoadCallback: (data: ICollection[])=> void
	onErrorCallback: (data: ICollection[])=> void
}

export async function getApiCollections({onLoadCallback, onErrorCallback}: IGetApiCollections) {
	fetch(baseURL + 'api/collections')
		.then(response => response.json())
		.then(data => {
			onLoadCallback(data)
		})
		.catch(error => {
			onErrorCallback(error)
		});
}

// export async function DeleteApiCollection(collectionID: number) {
	
// }