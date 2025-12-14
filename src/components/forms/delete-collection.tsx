import { useState } from "react";
import "@/assets/css/components/forms/form-delete.css";

type FormDeleteProps = {
	collectionId: string
}

const FormDeleteCollection = ({ collectionId }: FormDeleteProps) => {
	const [loading, setLoading] = useState(false)

	function onSubmitHandler(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();

		setLoading(true);

		fetch('http://127.0.0.1:3000/api/collections?id=' + collectionId, {
			method: 'DELETE',
		})
			.then((res) => {
				if (!res.ok) {
					return res.text().then(text => {
						throw new Error(`Ошибка: ${res.status} ${text}`);
					});
				}
			})
			.catch((err) => {
				console.error("Ошибка отправки:", err);
			})
			.finally(() => {
				setLoading(false);
				window.location.reload()
			});
	}

	return (
		<form className="form-delete" onSubmit={onSubmitHandler}>
			<button type="submit" disabled={loading}>
				{loading ? 'Удаление...' : 'Удалить'}
			</button>
		</form>
	);
};

export { FormDeleteCollection }