import type { ICollection } from "@/types/collections.interface"
import { useState } from "react"
import './Collection.css'

export type ICollectionProps = {
	collection: ICollection
	deleteHandler: (event: React.MouseEvent<HTMLButtonElement>) => void
}

const Collection = ({ collection, deleteHandler }: ICollectionProps) => {
	const [menuOpen, setMenuOpen] = useState(false)

	return (
		<div className="collection__item" id={collection.id?.toString()}>
			<img src={collection.image || "/img/dummy.png"} alt="dummy" className="collection__item-image" />
			<button className="collection-menu__btn-open" onClick={()=>{setMenuOpen(!menuOpen)}}></button>
			<div className="collection__item-title">{collection.title}</div>
			<div className="collection__item-description">{collection.description}</div>
			<div className="collection__item-info">
				<p className="collection__item-rating">Оценка: <span>{collection.rating}</span></p>
			</div>

			<div className={"collection-menu" + (menuOpen ? " open" : " close")} onClick={()=> {
				setMenuOpen(!menuOpen)
			}}>
				<button className="collection-menu__item">
					<img src="img/icons/icon-edit.svg" alt="edit" />
				</button>
				<button className="collection-menu__item" onClick={deleteHandler}>
					<img src="img/icons/icon-delete.svg" alt="delete" />
				</button>
			</div>
		</div>
	)
}

export {Collection}