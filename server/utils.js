export function getIDString() {
	
	const minLetter = 65
	const maxLetter = 80
	
	const countLetters = 6
	const letters = []

	for (let i = 0; i < countLetters; i++) {
		const letter = Math.random() * (maxLetter - minLetter) + minLetter
		letters.push(letter)
	}

	const code = String.fromCharCode(...letters)
	
	return code
}