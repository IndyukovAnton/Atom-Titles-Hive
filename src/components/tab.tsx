export type tab = {
	title: string,
	tag: string
}

export type ClickHander = (event: React.MouseEvent<HTMLButtonElement>) => void

type TabProps = {
	tab: tab,
	active : string,
	clickHandler: ClickHander,
	deleteHandler: (event: React.MouseEvent<HTMLImageElement>) => void
}

const Tab = (props: TabProps) => {
	return (
		<button onClick={props.clickHandler} className={"tab" + (props.active === props.tab.tag ? ' active' : '')} data-tab={props.tab.tag}>
			<span>{props.tab.title}</span>

			<img src="/img/icons/icon-delete.svg" alt="delete group" onClick={props.deleteHandler}/>
		</button>
	)
}

export { Tab }