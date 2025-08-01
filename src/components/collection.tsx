import { useState } from "react"

export type collection = {
	id: number,
	group: string,
	title: string,
	description: string,
	image: string | null,
	dateStart: string,
	dateEnd: string,
	rating: number
	deleteHandler: (event: React.MouseEvent<HTMLButtonElement>) => void
}

const Collection = (props: collection) => {
	const [menuOpen, setMenuOpen] = useState(false)

	return (
		<div className="collection__item" id={props.id.toString()}>
			<img src={props.image || "/img/dummy.png"}  alt="dummy" className="collection__item-image" />
			<button className="collection-menu__btn-open" onClick={()=>{setMenuOpen(!menuOpen)}}></button>
			<div className="collection__item-title">{props.title}</div>
			<div className="collection__item-description">{props.description}</div>
			<div className="collection__item-info">
				<p className="collection__item-date-start">Начал смотреть: <span>{props.dateStart}</span></p>
				<p className="collection__item-date-end">Закончил смотреть: <span>{props.dateEnd}</span></p>
				<p className="collection__item-rating">Оценка: <span>{props.rating}</span></p>
			</div>

			<div className={"collection-menu" + (menuOpen ? " open" : " close")} onClick={()=> {
				setMenuOpen(!menuOpen)
			}}>
				<button className="collection-menu__item">
					<img src="img/icons/icon-edit.svg" alt="edit" />
				</button>
				<button className="collection-menu__item" onClick={props.deleteHandler}>
					<img src="img/icons/icon-delete.svg" alt="delete" />
				</button>
			</div>
		</div>
	)
}

export {Collection}