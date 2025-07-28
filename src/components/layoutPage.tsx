import { Outlet } from "react-router-dom"

const LayoutPage = () => {
	return (
		<div className="container">
			<Outlet />
		</div>
	)
}

export { LayoutPage }