import { Tab } from "./tab"
import type { tab, ClickHander} from "./tab"

import '../assets/css/components/tabs.css'

type TabsProps = {
	tabs: tab[],
	active: string,
	clickHandler: ClickHander
}

const Tabs = (props: TabsProps)=> {
	return (
		<div className="tabs">
			{props.tabs.map((tab, index) => {
				return <Tab key={index} tab={tab} active={props.active} clickHandler={props.clickHandler}/>
			})}
		</div>
	)
}

export { Tabs }