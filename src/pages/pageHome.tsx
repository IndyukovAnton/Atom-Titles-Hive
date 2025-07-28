import type { tab } from "../components/tab"
import type { collection } from "../components/collection"

import { Tabs } from "../components/tabs"
import { CollectionList } from "../components/collectionList"

import collectionsData from '../collectionsData.json'

const HomePage = ()=> {

	console.log(collectionsData)

	const tabs: tab[] = [
		{
			title: 'Anime',
			tag: 'anime',
			active: true
		},
		{
			title: 'Films',
			tag: 'films',
			active: false
		}
	]

	const collections: collection[] = [
		{
			id: 0,
			title: "Тайтл 1",
			description: "Круто-круто",
			img: null,
			dateStart: new Date("2025.07.29"),
			dateEnd: new Date("2025.07.30"),
			rating: 10
		}
	]

	return (
		<div className="home">
			<Tabs tabs={tabs}></Tabs>

			<CollectionList collections={collections}></CollectionList>
		</div>
	)
}

export { HomePage }