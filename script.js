document.addEventListener("DOMContentLoaded", () => {
    // Variables de référence des éléments HTML
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

    // Variables de contrôle
    let phrases = [];
    let currentIndex = 0;
    let score = 0;
    let streak = 0;
    let draggedElement = null;
    let hintIndex = 0;
    let hintUsed = false;

    // Charger les phrases depuis le Local Storage et le fichier JSON
    function loadPhrases() {
        const storedPhrases = localStorage.getItem('phrases');

        // Charger les phrases depuis le JSON et fusionner avec le Local Storage
        fetch("phrases.json")
            .then(response => response.json())
            .then(data => {
                const jsonPhrases = data;

                if (storedPhrases) {
                    phrases = JSON.parse(storedPhrases);

                    // Ajouter les phrases du JSON qui ne sont pas dans le Local Storage
                    jsonPhrases.forEach((jsonPhrase) => {
                        if (!phrases.some((storedPhrase) => storedPhrase.chinese === jsonPhrase.chinese)) {
                            phrases.push(jsonPhrase);
                        }
                    });
                } else {
                    phrases = jsonPhrases;
                }

                savePhrasesToLocalStorage(); // Sauvegarder les phrases fusionnées dans le Local Storage
                renderPhraseList(); // Afficher la liste des phrases après chargement
            })
            .catch(error => console.error("Erreur de chargement des phrases : ", error));
    }

    // Sauvegarder les phrases dans le Local Storage
    function savePhrasesToLocalStorage() {
        localStorage.setItem('phrases', JSON.stringify(phrases));
    }

    // Appel de la fonction de chargement au démarrage
    loadPhrases();

    // Fonction de mélange aléatoire améliorée pour les mots et la ponctuation
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
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
                savePhrasesToLocalStorage();  // Sauvegarder les phrases importées
                renderPhraseList();  // Mettre à jour la liste après importation
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
                renderPhraseList();  // Mettre à jour la liste après ajout
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
        hintIndex = 0;  // Réinitialiser l'indice de hint
        hintUsed = false;  // Réinitialiser l'utilisation du hint
        feedbackDiv.innerHTML = "";  // Efface les messages de réponse précédents
        checkAnswerBtn.textContent = "Check Answer";  // Réinitialiser le texte du bouton
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
        if (checkAnswerBtn.textContent === "Next Sentence") {
            feedbackDiv.innerHTML = "";  // Effacer le feedback précédent
            checkAnswerBtn.textContent = "Check Answer";
            currentIndex++;

            if (currentIndex < phrases.length) {
                showNextPhrase();
            } else {
                feedbackDiv.innerHTML = "<br><span style='font-size: 2em; font-weight: bold;'>Exercice terminé !</span>";
            }
            return;
        }

        // Obtenir la réponse de l'utilisateur et la réponse correcte
        let userAnswer = [...dropZone.children].map(div => div.textContent).join("").trim();
        let correctAnswer = phrases[currentIndex].chinese.trim();

        // Supprimer les espaces, normaliser la réponse avant la comparaison, et supprimer tous les caractères invisibles
        userAnswer = userAnswer.replace(/[\s\u200B-\u200D\uFEFF]/g, "").normalize("NFC");
        correctAnswer = correctAnswer.replace(/[\s\u200B-\u200D\uFEFF]/g, "").normalize("NFC");

        // Comparaison stricte de la réponse de l'utilisateur et de la réponse correcte
        let isCorrect = userAnswer === correctAnswer;

        if (isCorrect) {
            feedbackDiv.innerHTML = `
                <div style='text-align: center; font-weight: bold; font-size: 1.8em; color: ${hintUsed ? "orange" : "green"};'>${hintUsed ? "Bonne réponse (sans points)" : "Bonne réponse"}</div>
                <span style='color: ${hintUsed ? "orange" : "green"}; font-size: 1.8em; font-weight: bold;'>${correctAnswer}</span>
                <br><span style='color: ${hintUsed ? "orange" : "green"}; font-size: 1.8em;'>${phrases[currentIndex].translation}</span>`;
            
            // Attribution des points seulement si aucun indice n'a été utilisé
            if (!hintUsed) {
                streak++;
                score += 10;
                if (streak >= 2) score += 5;
                if (streak >= 5) score += 10;
                if (streak >= 10) score += 25;
            } else {
                streak = 0;  // Réinitialiser la streak si un hint a été utilisé
            }

        } else {
            streak = 0;
            feedbackDiv.innerHTML = `
                <div style='text-align: center; font-weight: bold; font-size: 1.8em; color: red;'>Mauvaise réponse</div>
                <span style='color: red; font-size: 1.8em; font-weight: bold;'>${correctAnswer}</span>
                <br><span style='color: red; font-size: 1.8em;'>${phrases[currentIndex].translation}</span>`;
        }

        scoreDiv.innerHTML = `<span style='font-size: 1.8em;'>Score: ${score}</span><br><br>`;
        checkAnswerBtn.textContent = "Next Sentence";  // Changer le texte du bouton après la vérification
    });

    // Fonction pour afficher la phrase suivante
    function showNextPhrase() {
        const phrase = phrases[currentIndex];
        let tokens = Array.from(phrase.chinese);  // Convertir la phrase en tableau de caractères

        // Filtrer les espaces vides pour éviter d'avoir des cases vides dans les mots mélangés
        tokens = tokens.filter(token => token.trim() !== '');

        // Séparer les mots et la ponctuation
        const wordsAndPunctuation = [];
        tokens.forEach(token => {
            if (/[，。、]/.test(token)) {
                wordsAndPunctuation.push(token); // Ajouter la ponctuation dans une entrée séparée
            } else {
                wordsAndPunctuation.push(token);
            }
        });

        // Mélanger les mots et la ponctuation de manière robuste
        shuffleArray(wordsAndPunctuation);

        // Ajuster la taille de la traduction en fonction du dispositif utilisé
        let translationFontSize = window.innerWidth < 768 ? "1em" : "1.3em";
        let wordFontSize = window.innerWidth < 768 ? "2em" : "3em";

        phraseDiv.innerHTML = `<span style='font-size: ${translationFontSize};'>${phrase.translation}</span>`;
        wordsContainer.innerHTML = "";
        dropZone.innerHTML = "";

        wordsAndPunctuation.forEach(word => {
            const div = document.createElement("div");
            div.textContent = word;
            div.style.fontSize = wordFontSize;
            div.style.backgroundColor = '#f0f0f0';
            div.style.padding = '5px';
            div.style.margin = '5px';
            div.style.borderRadius = '8px';
            div.style.cursor = 'pointer';
            div.classList.add("draggable-word");

            // Gestion des événements de glisser-déposer pour desktop
            div.addEventListener("dragstart", (e) => {
                draggedElement = e.target;
            });

            // Gestion du clic pour déplacer des mots
            div.addEventListener("click", () => {
                if (!div.classList.contains("dropped-word")) {
                    dropZone.appendChild(div);
                    div.classList.add("dropped-word");
                } else {
                    wordsContainer.appendChild(div);
                    div.classList.remove("dropped-word");
                }
            });

            // Ajouter la gestion du glisser-déposer pour mobile (touchstart, touchmove, touchend)
            div.addEventListener("touchstart", handleTouchStart);
            div.addEventListener("touchmove", handleTouchMove);
            div.addEventListener("touchend", handleTouchEnd);

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

        // Réinitialiser l'indice de hint
        hintIndex = 0;
        hintRevealDiv.innerHTML = ""; // Réinitialiser l'affichage du hint
        hintUsed = false;  // Réinitialiser l'utilisation du hint pour la nouvelle phrase
    }

    // Fonctions pour gérer les événements tactiles
    function handleTouchStart(e) {
        draggedElement = e.target;
        draggedElement.classList.add("dragging");
    }

    function handleTouchMove(e) {
        const touch = e.touches[0];
        const elem = document.elementFromPoint(touch.clientX, touch.clientY);
        if (elem && elem !== draggedElement && elem.classList.contains("dropped-word")) {
            dropZone.insertBefore(draggedElement, elem);
        } else if (elem && elem !== draggedElement) {
            dropZone.appendChild(draggedElement);
        }
    }

    function handleTouchEnd(e) {
        draggedElement.classList.remove("dragging");
        draggedElement = null;
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

    // Modification du style du titre principal
    const title = document.querySelector("h1");
    if (title) {
        title.style.fontFamily = "'Poppins', sans-serif";
        title.style.fontSize = "3em";
        title.style.color = "#2a9d8f";
        title.style.textAlign = "center";
        title.style.marginTop = "20px";
        title.style.textShadow = "1px 1px 2px rgba(0, 0, 0, 0.1)"; // Ombre plus douce
    }

    // Ajouter un bouton "Hint" et sa fonctionnalité
    const hintBtn = document.createElement("button");
    hintBtn.textContent = "Hint";
    hintBtn.style.backgroundColor = "#007bff";
    hintBtn.style.color = "white";
    hintBtn.style.border = "none";
    hintBtn.style.padding = "10px 20px";
    hintBtn.style.marginTop = "20px";
    hintBtn.style.cursor = "pointer";
    hintBtn.style.fontSize = "1.2em";
    hintBtn.style.borderRadius = "5px";
    hintBtn.style.alignSelf = "center";
    exerciseDiv.appendChild(hintBtn);

    const hintRevealDiv = document.createElement("div");
    hintRevealDiv.style.marginTop = "10px";
    hintRevealDiv.style.fontSize = "1.5em";
    hintRevealDiv.style.fontWeight = "bold";
    hintRevealDiv.style.color = "#007bff";
    exerciseDiv.appendChild(hintRevealDiv);

    hintBtn.addEventListener("click", () => {
        if (hintIndex < phrases[currentIndex].chinese.length) {
            hintRevealDiv.textContent += phrases[currentIndex].chinese[hintIndex];
            hintIndex++;
            hintUsed = true;  // Marquer que le hint a été utilisé
        }
    });
});
