export type tab = {
	title: string,
	tag: string
	active: boolean,
}

const Tab = (props: tab) => {
	return (
		<button className={"tab" + (props.active ? ' active' : '')} data-tab={props.tag}>{props.title}</button>
	)
}

export { Tab }