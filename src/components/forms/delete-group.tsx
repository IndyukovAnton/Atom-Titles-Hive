import { useState } from "react";
import "@/assets/css/components/forms/form-delete.css";

type FormDeleteProps = {
	groupTag: string
}

const FormDeleteGroup = (props: FormDeleteProps) => {
	const [loading, setLoading] = useState(false)

	function onSubmitHandler(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();

		setLoading(true);

		fetch('http://127.0.0.1:3000/api/groups?tag='+props.groupTag, {
			method: 'DELETE',
		})
			.then((res) => {
				if (res.ok) {
					alert('Группа удалена!');
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

	if (!props.groupTag) { return }

	return (
		<form className="form-delete" onSubmit={onSubmitHandler}>
			<button type="submit" disabled={loading}>
				{loading ? 'Удаление...' : 'Удалить'}
			</button>
		</form>
	);
};

export { FormDeleteGroup }