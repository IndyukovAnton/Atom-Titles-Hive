import initTabs from "./components/tabs.js"
import ModalWindow from "./components/modal_window.js"

document.addEventListener('DOMContentLoaded', ()=> {
	initTabs()

	const modalWindow = new ModalWindow()
})