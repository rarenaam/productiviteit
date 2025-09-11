const textarea = document.getElementById("noteInput");

		window.onload = () => {
			const savedNote = localStorage.getItem("mijnNotitie");
			if (savedNote) {
				textarea.value = savedNote
			}
		};

		function saveNote() {
			localStorage.setItem("mijnNotitie", textarea.value);
			alert("notitie opgeslagen")
		}

		function clearNote() {
			if (confirm('Weet je zeker dat je alles wilt verwijderen?')) {
				localStorage.removeItem('mijnNotitie');
				textarea.value = '';
			}
		}
