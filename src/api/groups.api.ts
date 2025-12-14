import type { IGroup } from "@/types/group.interface";

const baseURL = "http://127.0.0.1:3000/"

interface IGetApiGroups {
	onLoadCallback: (data: IGroup[])=> void
	onErrorCallback: (data: IGroup[])=> void
}

export async function getApiGroups({ onLoadCallback, onErrorCallback }: IGetApiGroups) {
	fetch(baseURL+'api/groups')
		.then(response => response.json())
		.then(data => {
			onLoadCallback(data)
		})
		.catch(error => {
			onErrorCallback(error)
		});
}