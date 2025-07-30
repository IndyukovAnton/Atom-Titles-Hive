import { Collection } from "./collection"
import type { collection } from "./collection"

import '../assets/css/components/collection.css'

type CollectionProps = {
	group: string,
	collections: collection[],
	activeGroup: string
}

const CollectionList = (props: CollectionProps) => {
	return (
		<div className={"collection" + (props.activeGroup === props.group ? " active": '')}>
			{props.collections.map((collection, index) => {
				if (collection.group === props.group) {
					return <Collection key={index} {...collection}></Collection>
				}
			})}
		</div>
	)
}

export { CollectionList }