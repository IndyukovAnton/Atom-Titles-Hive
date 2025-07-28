// import { useState } from "react"

import { Tab } from "./tab"
import type { tab } from "./tab"

import '../assets/css/components/tabs.css'

type TabsProps = {
	tabs: tab[],
}

const Tabs = (props: TabsProps)=> {
	return (
		<div className="tabs">
			{props.tabs.map((tab, index) => {
				return <Tab key={index} {...tab}/>
			})}
		</div>
	)
}

export { Tabs }