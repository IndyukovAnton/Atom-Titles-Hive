export default function initTabs() {
	const tabs = document.querySelectorAll('[tab]')

	tabs.forEach(tab => {
		tab.addEventListener('click', ()=> { switchTab(tab) })
	})

	function switchTab(tab) {

		const tag = tab.getAttribute('tab')

		const collections = document.querySelectorAll("[collection]")

		hideAllCollections(collections, tag)
	}

	function hideAllCollections(collections, tag) {
		collections.forEach(collection => {
			if (collection.getAttribute('collection') !== tag) {
				collection.classList.remove('visible')
			} else {
				collection.classList.add('visible')
			}
		})
	}
}