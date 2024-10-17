// script.js
document.addEventListener("DOMContentLoaded", async () => {
    const startBtn = document.getElementById("startBtn");
    const backBtn = document.getElementById("backBtn");
    const numQuestions = document.getElementById("numQuestions");
    const exerciseDiv = document.getElementById("exercise");
    const welcomeDiv = document.getElementById("welcome");
    const phraseDiv = document.getElementById("phrase");
    const wordsContainer = document.getElementById("words-container");
    const dropZone = document.getElementById("drop-zone");
    const feedbackDiv = document.getElementById("feedback");
    const checkAnswerBtn = document.getElementById("checkAnswer");
    const scoreDiv = document.getElementById("score");
    const uploadBtn = document.getElementById("uploadBtn");
    const uploadCSV = document.getElementById("uploadCSV");
    const listBtn = document.getElementById("listBtn");
    const listDiv = document.getElementById("list");

    let phrases = [];
    let currentIndex = 0;
    let score = 0;
    let streak = 0;

    // Charger les phrases depuis le fichier JSON
    try {
        const response = await fetch("phrases.json");
        if (response.ok) {
            phrases = await response.json();
        }
    } catch (error) {
        console.error("Échec du chargement des phrases : ", error);
    }

    // Gestion de l'importation CSV
    uploadBtn.addEventListener("click", () => {
        uploadCSV.click();
    });

    uploadCSV.addEventListener("change", () => {
        const file = uploadCSV.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const text = e.target.result;
                const lines = text.split("\n");
                lines.forEach(line => {
                    const [chinese, translation] = line.split(",");
                    if (chinese && translation) {
                        phrases.push({ chinese: chinese.trim(), translation: translation.trim() });
                    }
                });
                alert("Phrases successfully uploaded!");
            };
            reader.readAsText(file);
        } else {
            alert("Please select a CSV file to upload.");
        }
    });

    // Bouton Liste pour afficher toutes les phrases
    listBtn.addEventListener("click", () => {
        renderPhraseList();
        welcomeDiv.style.display = "none";
        exerciseDiv.style.display = "none";
        listDiv.style.display = "block";
    });

    // Fonction pour afficher et gérer la liste des phrases
    function renderPhraseList() {
        listDiv.innerHTML = "";

        const addPhraseBtn = document.createElement("button");
        addPhraseBtn.textContent = "Ajouter une phrase";
        addPhraseBtn.addEventListener("click", () => {
            const newChinese = prompt("Entrez la nouvelle phrase en chinois :");
            const newTranslation = prompt("Entrez la traduction :");
            if (newChinese && newTranslation) {
                phrases.push({ chinese: newChinese.trim(), translation: newTranslation.trim() });
                alert("Phrase ajoutée avec succès !");
                renderPhraseList();
            }
        });

        listDiv.appendChild(addPhraseBtn);

        phrases.forEach((phrase, index) => {
            const phraseEntry = document.createElement("div");
            phraseEntry.innerHTML = `<span style='font-size: 1.5em;'>${phrase.chinese} - ${phrase.translation}</span> 
                                    <button onclick='editPhrase(${index})'>Edit</button> 
                                    <button onclick='deletePhrase(${index})'>Delete</button>`;
            listDiv.appendChild(phraseEntry);
        });

        const backToWelcomeBtn = document.createElement("button");
        backToWelcomeBtn.textContent = "Retour";
        backToWelcomeBtn.addEventListener("click", () => {
            listDiv.style.display = "none";
            welcomeDiv.style.display = "block";
        });

        listDiv.appendChild(backToWelcomeBtn);
    }

    // Bouton pour démarrer l'exercice
    startBtn.addEventListener("click", () => {
        const num = parseInt(numQuestions.value, 10);
        const selectedPhrases = phrases.sort(() => Math.random() - 0.5).slice(0, num);
        currentIndex = 0;
        score = 0;
        streak = 0;
        if (selectedPhrases.length === 0) {
            alert("Aucune phrase disponible. Veuillez importer ou ajouter des phrases.");
            return;
        }
        phrases = selectedPhrases;
        showNextPhrase();
        exerciseDiv.style.display = "block";
        welcomeDiv.style.display = "none";
        listDiv.style.display = "none";
    });

    // Bouton Retour de la section exercice
    backBtn.addEventListener("click", () => {
        exerciseDiv.style.display = "none";
        listDiv.style.display = "none";
        welcomeDiv.style.display = "block";
    });

    // Vérification de la réponse
    checkAnswerBtn.addEventListener("click", () => {
        const userAnswer = [...dropZone.children].map(div => div.textContent).join("");
        const correctAnswer = phrases[currentIndex].chinese;

        if (userAnswer === correctAnswer) {
            streak++;
            score += 10;
            if (streak >= 2) score += 5;
            if (streak >= 5) score += 10;
            if (streak >= 10) score += 25;
            feedbackDiv.innerHTML = `<span style='color: green;'>Bonne réponse !</span>`;
        } else {
            streak = 0;
            feedbackDiv.innerHTML = `<span style='color: red;'>Mauvaise réponse !</span><br>La phrase correcte est : ${correctAnswer}`;
        }

        scoreDiv.textContent = `Score: ${score}`;
        feedbackDiv.innerHTML += `<br>Traduction : ${phrases[currentIndex].translation}`;
        currentIndex++;

        if (currentIndex < phrases.length) {
            showNextPhrase();
        } else {
            feedbackDiv.innerHTML += "<br>Exercice terminé !";
        }
    });

    // Fonction pour afficher la phrase suivante
    function showNextPhrase() {
        const phrase = phrases[currentIndex];
        // Séparer chaque caractère de la phrase chinoise
        const tokens = phrase.chinese.split("");
        const shuffledWords = tokens.sort(() => Math.random() - 0.5);

        phraseDiv.innerHTML = `<span style='font-size: 3em;'>Phrase à réorganiser : ${phrase.translation}</span>`;
        wordsContainer.innerHTML = "";
        dropZone.innerHTML = "";

        shuffledWords.forEach(word => {
            const div = document.createElement("div");
            div.textContent = word;
            div.style.fontSize = '3em';
            div.classList.add("word");
            div.draggable = true;

            div.addEventListener("dragstart", handleDragStart);
            div.addEventListener("click", () => {
                // Déplace le mot vers le dropZone au lieu de le cloner
                if (!div.classList.contains("dropped-word")) {
                    dropZone.appendChild(div);
                    div.classList.add("dropped-word");
                    div.draggable = true; // Rendre le mot toujours déplaçable
                }
            });

            wordsContainer.appendChild(div);
        });

        dropZone.addEventListener("click", (e) => {
            if (e.target.classList.contains("dropped-word")) {
                wordsContainer.appendChild(e.target);
                e.target.classList.remove("dropped-word");
            }
        });
    }

    function handleDragStart(e) {
        e.dataTransfer.setData("text/plain", e.target.id);
    }

    function handleDrop(e) {
        e.preventDefault();
        const sourceId = e.dataTransfer.getData("text/plain");
        const sourceElement = document.getElementById(sourceId);
        if (sourceElement && !dropZone.contains(sourceElement)) {
            dropZone.appendChild(sourceElement);
            sourceElement.classList.add("dropped-word");
        } else if (sourceElement && dropZone.contains(sourceElement)) {
            wordsContainer.appendChild(sourceElement);
            sourceElement.classList.remove("dropped-word");
        }
    }

    function handleDragOver(e) {
        e.preventDefault();
    }

    dropZone.addEventListener("dragover", handleDragOver);
    dropZone.addEventListener("drop", handleDrop);

    // Fonctions pour modifier et supprimer des phrases
    window.editPhrase = function(index) {
        const newChinese = prompt("Enter new Chinese phrase:", phrases[index].chinese);
        const newTranslation = prompt("Enter new translation:", phrases[index].translation);
        if (newChinese && newTranslation) {
            phrases[index] = { chinese: newChinese.trim(), translation: newTranslation.trim() };
            alert("Phrase updated successfully!");
            renderPhraseList();
        }
    };

    window.deletePhrase = function(index) {
        if (confirm("Are you sure you want to delete this phrase?")) {
            phrases.splice(index, 1);
            alert("Phrase deleted successfully!");
            renderPhraseList();
        }
    };
});