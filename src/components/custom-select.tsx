import { useState } from "react";
import '../assets/css/components/custom-select.css'

type Option = {
	title: string;
	value: string;
};

type SelectProps = {
	inputName: string;
	items: Option[];
	onChange: (value: string) => void
};

const Select = ({ inputName, items, onChange }: SelectProps) => {
	const [isOpen, setIsOpen] = useState(false);
	const [active, setActive] = useState<Option>({ title: 'Пусто', value: '' });

	return (
		<div
			className={`select ${isOpen ? 'opened' : ''}`}
			onClick={() => setIsOpen(prev => !prev)} // можно переключать
			tabIndex={0} // для доступности
			role="combobox"
			aria-expanded={isOpen}
		>
			{/* ✅ Гарантируем, что value — всегда строка */}
			<input
				className="select__hidden"
				type="hidden"
				name={inputName}
				value={active.value ?? ''} // fallback
			/>

			<div className="select__chosed">
				{active.title}
			</div>

			{isOpen && (
				<div className="select__list" role="listbox">
					{items.map((item, index) => (
						<div
							key={index}
							className="option"
							data-value={item.tag}
							role="option"
							aria-selected={active.value === item.tag}
							onClick={(e) => {
								e.stopPropagation();
								setActive({title: item.title, value: item.tag});
								onChange(active.value);
								setIsOpen(false);
							}}
						>
							{item.title}
						</div>
					))}
				</div>
			)}
		</div>
	);
};

export { Select };