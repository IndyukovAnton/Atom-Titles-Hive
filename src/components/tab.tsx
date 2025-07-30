export type tab = {
	title: string,
	tag: string
}

export type ClickHander = (event: React.MouseEvent<HTMLButtonElement>) => void

type TabProps = {
	tab: tab,
	active : string,
	clickHandler: ClickHander
}

const Tab = (props: TabProps) => {
	return (
		<button onClick={props.clickHandler} className={"tab" + (props.active === props.tab.tag ? ' active' : '')} data-tab={props.tab.tag}>{props.tab.title}</button>
	)
}

export { Tab }