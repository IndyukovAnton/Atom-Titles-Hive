import { Collection } from "./collection"
import type { collection } from "./collection"

import '../assets/css/components/collection.css'

type CollectionProps = {
	collections: collection[]
}

const CollectionList = (props: CollectionProps) => {
	return (
		<div className="collection">
			{props.collections.map((collection, index) => {
				return <Collection key={index} {...collection}></Collection>
			})}
		</div>
	)
}

export { CollectionList }