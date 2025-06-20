export default class ModalWindow {
	constructor(selector = "[modal-window]", buttonOpen = "[modal-window-button]") {
		this.elements = document?.querySelectorAll(selector)

		this.init()
	}

	show(el) {
		el.classList.add('active')
	}

	hide(el) {
		el.classList.remove('active')
	}

	init() {
		this.elements.forEach(element => {
			const tag_modal = element.getAttribute('modal-window')
			const buttonsOpen = document?.querySelectorAll(`[modal-window-button="${tag_modal}"]`)
			const buttonClose = element.querySelector('[modal-window-close]')
			
			buttonClose.addEventListener('click', ()=> {
				this.hide(element)
			})

			buttonsOpen.forEach(button => {
				button.addEventListener('click', ()=> {
					this.show(element)
				})
			})
		})
	}
}