import { useState } from "react";
import "../../assets/css/components/forms/form-add.css";

const FormAddGroup = () => {
	const [title, setTitle] = useState('');
	const [tag, setTag] = useState('');
	const [loading, setLoading] = useState(false)

	function validateForm() {
		if (!title.trim()) {
			alert('Поле названия не должно быть пустым!');
			return false;
		}
		if (!tag.trim()) {
			alert('Поле тег не должно быть пустым!');
			return false;
		}

		return true;
	}

	function onSubmitHandler(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();

		if (!validateForm()) return;

		setLoading(true);

		const formData = new FormData();
		formData.append('title', title);
		formData.append('tag', tag);

		fetch('http://127.0.0.1:3000/groups', {
			method: 'POST',
			body: formData,
		})
			.then((res) => {
				if (res.ok) {
					alert('Группа добавлена!');
					// Можно сбросить форму
					setTitle('');
					setTag('');
				} else {
					return res.text().then(text => {
						throw new Error(`Ошибка: ${res.status} ${text}`);
					});
				}
			})
			.catch((err) => {
				console.error("Ошибка отправки:", err);
				alert('Ошибка при отправке данных');
			})
			.finally(() => {
				setLoading(false);
				window.location.reload()
			});
	}

	return (
		<form className="form-add" onSubmit={onSubmitHandler}>
			<input
				name="title"
				type="text"
				placeholder="Название"
				value={title}
				onChange={(e) => setTitle(e.target.value)}
			/>
			<input
				name="tag"
				type="text"
				placeholder="tag"
				value={tag}
				onChange={(e) => setTag(e.target.value)}
			/>
			<button type="submit" disabled={loading}>
				{loading ? 'Отправка...' : 'Добавить'}
			</button>
		</form>
	);
};

export { FormAddGroup };