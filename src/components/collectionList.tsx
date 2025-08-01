import { Collection } from "./collection"
import type { collection } from "./collection"

import '../assets/css/components/collection.css'

type CollectionProps = {
	group: string,
	collections: collection[],
	activeGroup: string
	deleteHandler: (event: React.MouseEvent<HTMLButtonElement>) => void
}

const CollectionList = (props: CollectionProps) => {
	return (
		<div className={"collection" + (props.activeGroup === props.group ? " active": '')}>
			{props.collections.map((collection, index) => {
				if (collection.group === props.group) {
					return <Collection key={index} {...collection} deleteHandler={props.deleteHandler}></Collection>
				}
			})}
		</div>
	)
}

export { CollectionList }