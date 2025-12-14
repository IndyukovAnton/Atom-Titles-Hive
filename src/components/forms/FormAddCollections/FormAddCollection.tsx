import { useState } from "react";
import "./FormAddCollection.css";
import type { IFormAddProps } from "@/types/form.interface";


const FormAddCollectionItem = (props: IFormAddProps) => {
	const minRating = 0;
	const maxRating = 10;

	const [group, setGroup] = useState(props.groups[0]?.tag || 'all');
	const [title, setTitle] = useState('');
	const [description, setDescription] = useState('');
	const [dateStart, setDateStart] = useState('');
	const [dateEnd, setDateEnd] = useState('');
	const [rating, setRating] = useState<number>(0);
	const [image, setImage] = useState<File | null>(null);
	const [loading, setLoading] = useState(false);

	function validateForm() {
		if (!title.trim()) {
			alert('Поле названия не должно быть пустым!');
			return false;
		}
		if (!description.trim()) {
			alert('Поле описания не должно быть пустым!');
			return false;
		}
		if (rating < minRating || rating > maxRating) {
			alert('Рейтинг должен быть от 0 до 10!');
			return false;
		}

		return true;
	}

	function onSubmitHandler(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();

		if (!validateForm()) return;

		setLoading(true);

		// ✅ Создаём FormData
		const formData = new FormData();
		formData.append('group', group);
		formData.append('title', title);
		formData.append('description', description);
		formData.append('date-start', dateStart);
		formData.append('date-end', dateEnd);
		formData.append('rating', rating.toString());

		if (image) {
			formData.append('image', image); // ← файл как есть
		}

		// ✅ Отправляем как multipart/form-data (браузер сам установит заголовок)
		fetch('http://127.0.0.1:3000/api/collections', {
			method: 'POST',
			body: formData,
		})
			.then((res) => {
				if (res.ok) {
					alert('Элемент добавлен!');
					// Можно сбросить форму
					setTitle('');
					setDescription('');
					setRating(0);
					setImage(null);
					(e.target as HTMLFormElement).reset();
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
				onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
			/>
			<input
				name="description"
				type="text"
				placeholder="Описание"
				value={description}
				onChange={(e) => setDescription(e.target.value)}
			/>
			
			<input name="date-start" type="date" onChange={(e)=> {
				setDateStart(e.currentTarget.value)
			}}/>

			<input name="date-end" type="date" onChange={(e)=> {
				setDateEnd(e.currentTarget.value)
			}}/>

			<input
				name="rating"
				type="number"
				min={minRating}
				max={maxRating}
				value={rating}
				onChange={(e) => setRating(Number(e.target.value))}
			/>

			<select required name="group" onChange={(e)=> {
				setGroup(e.currentTarget.value)
			}}>
				{props.groups.map((group, index) => {
					return <option key={index} value={group.tag}>{group.title}</option>
				})}
			</select>

			<input
				name="image"
				type="file"
				accept="image/*"
				onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
					const file = e.target.files?.[0];
					if (file) {
						setImage(file);
					}
				}}
			/>
			<button type="submit" disabled={loading}>
				{loading ? 'Отправка...' : 'Добавить'}
			</button>
		</form>
	);
};

export { FormAddCollectionItem };