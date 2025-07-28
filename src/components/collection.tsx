export type collection = {
	id: number,
	title: string,
	description: string,
	img: string | null,
	dateStart: Date,
	dateEnd: Date,
	rating: number
}

const Collection = (props: collection) => {

	const fullDateStart = `${props.dateStart.getDate()}.${props.dateStart.getMonth()}.${props.dateStart.getFullYear()}`
	const fullDateEnd = `${props.dateEnd.getDate()}.${props.dateEnd.getMonth()}.${props.dateEnd.getFullYear()}`

	return (
		<div className="collection__item">
			<img src={props.img || "/img/dummy.png"}  alt="dummy" className="collection__item-image" />
			<div className="collection__item-title">{props.title}</div>
			<div className="collection__item-description">{props.description}</div>
			<div className="collection__item-info">
				<p className="collection__item-date-start">{fullDateStart}</p>
				<p className="collection__item-date-end">{fullDateEnd}</p>
				<p className="collection__item-date-rating">{props.rating}</p>
			</div>
		</div>
	)
}

export {Collection}