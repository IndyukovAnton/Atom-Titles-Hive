import { Tab, type ClickHander } from "../Tab/Tab"

import './TabsList.css'
import type { IGroup } from "@/types/group.interface"

interface ITabsProps {
	tabs: IGroup[],
	active: string,
	clickHandler: ClickHander,
	deleteHandler: (event: React.MouseEvent<HTMLImageElement>) => void
}

const TabsList = ({tabs, active, clickHandler, deleteHandler}: ITabsProps)=> {
	return (
		<div className="tabs">
			{tabs.map((tab) => {
				return (
					<Tab key={tab.id} tab={tab} active={active} clickHandler={clickHandler} deleteHandler={deleteHandler}/>
				)
			})}
		</div>
	)
}

export { TabsList }