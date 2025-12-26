const Button = ({ disabled, onClick, children }: { disabled?: boolean, onClick: (e: React.MouseEvent<HTMLButtonElement>) => void, children: React.ReactNode }) => {
    return (
	    <button type="button" className="btn btn--accent" onClick={onClick} disabled={disabled}>
	      {children}
	    </button>
    )
}

export { Button }