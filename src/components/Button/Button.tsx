import type { PropsWithChildren } from "react"

interface IButton {
	onClick: ()=> void
}

export const Button = ({ onClick, children }: PropsWithChildren<IButton>)=> {
	return (
		<button className="btn-add" onClick={onClick}>
			{children}
		</button>
	)
}