import { Collection } from "@/components/Collection/Collection"

import type { ICollection } from "@/types/collections.interface"

interface ICollectionListProps {
	group: string,
	collections: ICollection[],
	activeGroup: string
	deleteHandler: (event: React.MouseEvent<HTMLButtonElement>) => void
}

const CollectionList = ({group, collections, activeGroup, deleteHandler}: ICollectionListProps) => {

	return (
		<div className={"collection" + (activeGroup === group ? " active": '')}>
			{collections.map((collection) => {
				if (`${collection.tag}` === group) {
					return <Collection key={collection.id} collection={collection} deleteHandler={deleteHandler}></Collection>
				}
			})}
		</div>
	)
}

export { CollectionList }