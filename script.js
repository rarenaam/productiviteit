function saveNote() {
    const textarea = document.getElementById("noteInput");
    const text = textarea.value;
    // LocalStorage opslaan
    localStorage.setItem("mijnNotitie", text);

    // Datum + tijd voor bestandsnaam
    const now = new Date();
    const timestamp =
        now.getFullYear() + "-" +
        String(now.getMonth() + 1).padStart(2, "0") + "-" +
        String(now.getDate()).padStart(2, "0") + "_" +
        String(now.getHours()).padStart(2, "0") + "-" +
        String(now.getMinutes()).padStart(2, "0");

    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `notitie_${timestamp}.txt`;
    a.click();

    URL.revokeObjectURL(url);

    alert("notitie opgeslagen en gedownload");
}
