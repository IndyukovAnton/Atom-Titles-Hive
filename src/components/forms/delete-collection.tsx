import { useState } from "react";
import "../../assets/css/components/forms/form-delete.css";

type FormDeleteProps = {
	collectionId: string
}

const FormDeleteCollection = (props: FormDeleteProps) => {
	const [loading, setLoading] = useState(false)

	function onSubmitHandler(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();

		setLoading(true);

		fetch('http://127.0.0.1:3000/collections?id='+props.collectionId, {
			method: 'DELETE',
		})
			.then((res) => {
				if (res.ok) {
					alert('Элемент удалён!');
				} else {
					return res.text().then(text => {
						throw new Error(`Ошибка: ${res.status} ${text}`);
					});
				}
			})
			.catch((err) => {
				console.error("Ошибка отправки:", err);
				alert('Не удалось удалить!');
			})
			.finally(() => {
				setLoading(false);
				window.location.reload()
			});
	}

	if (!props.collectionId) { return }

	return (
		<form className="form-delete" onSubmit={onSubmitHandler}>
			<input type="hidden" name="id" value={props.collectionId}/>

			<button type="submit" disabled={loading}>
				{loading ? 'Удаление...' : 'Удалить'}
			</button>
		</form>
	);
};

export { FormDeleteCollection }