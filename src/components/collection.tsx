export type collection = {
	id: number,
	group: string,
	title: string,
	description: string,
	image: string | null,
	dateStart: string,
	dateEnd: string,
	rating: number
}

const Collection = (props: collection) => {
	return (
		<div className="collection__item">
			<img src={props.image || "/img/dummy.png"}  alt="dummy" className="collection__item-image" />
			<div className="collection__item-title">{props.title}</div>
			<div className="collection__item-description">{props.description}</div>
			<div className="collection__item-info">
				<p className="collection__item-date-start">Начал смотреть: <span>{props.dateStart}</span></p>
				<p className="collection__item-date-end">Закончил смотреть: <span>{props.dateEnd}</span></p>
				<p className="collection__item-rating">Оценка: <span>{props.rating}</span>★</p>
			</div>
		</div>
	)
}

export {Collection}