document.addEventListener("DOMContentLoaded", () => {
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
    let draggedElement = null; // Élément actuellement en cours de glisser-déposer

    // Charger les phrases depuis le Local Storage ou le fichier JSON
    function loadPhrases() {
        const storedPhrases = localStorage.getItem('phrases');
        if (storedPhrases) {
            phrases = JSON.parse(storedPhrases);
        } else {
            fetch("phrases.json")
                .then(response => response.json())
                .then(data => {
                    phrases = data;
                    savePhrasesToLocalStorage(); // Sauvegarde initiale
                })
                .catch(error => console.error("Erreur de chargement des phrases : ", error));
        }
    }

    // Sauvegarder les phrases dans le Local Storage
    function savePhrasesToLocalStorage() {
        localStorage.setItem('phrases', JSON.stringify(phrases));
    }

    // Appel de la fonction de chargement au démarrage
    loadPhrases();

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
                savePhrasesToLocalStorage();  // Sauvegarder les phrases importées
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
                savePhrasesToLocalStorage();  // Sauvegarder après ajout
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

    // Fonction pour démarrer l'exercice
    startBtn.addEventListener("click", () => {
        const num = parseInt(numQuestions.value, 10);
        const selectedPhrases = phrases.slice().sort(() => Math.random() - 0.5).slice(0, num);
        currentIndex = 0;
        score = 0;
        streak = 0;
        feedbackDiv.innerHTML = "";  // Efface les messages de réponse précédents
        if (selectedPhrases.length === 0) {
            alert("Aucune phrase disponible. Veuillez importer ou ajouter des phrases.");
            return;
        }
        phrases = selectedPhrases;  // Stocker l'ordre mélangé pour cet exercice
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
            feedbackDiv.innerHTML = `<span style='color: green; font-size: 1.8em;'>${correctAnswer}<br>${phrases[currentIndex].translation}</span>`;
        } else {
            streak = 0;
            feedbackDiv.innerHTML = `
                <span style='color: red; font-size: 1.8em; font-weight: bold;'>${correctAnswer}</span>
                <br><span style='color: red; font-size: 1.8em;'>${phrases[currentIndex].translation}</span>`;
        }

        scoreDiv.innerHTML = `<span style='font-size: 1.8em;'>Score: ${score}</span><br><br>`;
        currentIndex++;

        if (currentIndex < phrases.length) {
            showNextPhrase();
        } else {
            feedbackDiv.innerHTML += "<br><span style='font-size: 2em; font-weight: bold;'>Exercice terminé !</span>";
        }
    });

    // Fonction pour afficher la phrase suivante
    function showNextPhrase() {
        const phrase = phrases[currentIndex];
        const tokens = phrase.chinese.split("").filter(token => token.trim() !== "");

        const shuffledWords = tokens.sort(() => Math.random() - 0.5);

        phraseDiv.innerHTML = `<span style='font-size: 1.3em;'>${phrase.translation}</span>`;
        wordsContainer.innerHTML = "";
        dropZone.innerHTML = "";

        shuffledWords.forEach(word => {
            const div = document.createElement("div");
            div.textContent = word;
            div.style.fontSize = '3em';
            div.style.backgroundColor = '#f0f0f0';
            div.style.padding = '5px';
            div.style.margin = '5px';
            div.style.borderRadius = '8px';
            div.style.cursor = 'pointer';
            div.draggable = true;
            div.classList.add("draggable-word");

            div.addEventListener("dragstart", (e) => {
                draggedElement = e.target;
            });

            div.addEventListener("click", () => {
                if (!div.classList.contains("dropped-word")) {
                    dropZone.appendChild(div);
                    div.classList.add("dropped-word");
                } else {
                    wordsContainer.appendChild(div);
                    div.classList.remove("dropped-word");
                }
            });

            wordsContainer.appendChild(div);
        });

        dropZone.style.display = "flex"; // Réorganiser les mots horizontalement
        dropZone.style.flexWrap = "wrap"; // Autoriser le retour à la ligne si nécessaire
        dropZone.style.justifyContent = "center"; // Centrer les mots dans la zone

        dropZone.addEventListener("dragover", (e) => {
            e.preventDefault();
        });

        dropZone.addEventListener("drop", (e) => {
            e.preventDefault();
            if (draggedElement) {
                const dropTarget = e.target;
                if (dropTarget.classList.contains("dropped-word")) {
                    dropZone.insertBefore(draggedElement, dropTarget);
                } else {
                    dropZone.appendChild(draggedElement);
                }
                draggedElement.classList.add("dropped-word");
            }
        });
    }

    // Fonctions pour modifier et supprimer des phrases
    window.editPhrase = function(index) {
        const newChinese = prompt("Enter new Chinese phrase:", phrases[index].chinese);
        const newTranslation = prompt("Enter new translation:", phrases[index].translation);
        if (newChinese && newTranslation) {
            phrases[index] = { chinese: newChinese.trim(), translation: newTranslation.trim() };
            savePhrasesToLocalStorage();  // Sauvegarder après modification
            renderPhraseList();
        }
    };

    window.deletePhrase = function(index) {
        if (confirm("Are you sure you want to delete this phrase?")) {
            phrases.splice(index, 1);
            savePhrasesToLocalStorage();  // Sauvegarder après suppression
            renderPhraseList();
        }
    };
});
