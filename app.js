// Variables globales pour stocker les données de l'application
let utilisateurActuel = null;
let utilisateurs = new Map();
let utilisateursGlobaux = [];
let minuteurActuel = null;
let intervalleMinuteur = null;
let minuteurEnCours = false;
let typeMinuteurActuel = 'pomodoro';
let phaseActuelle = 'work';
let cycleActuel = 1;
let tempsRestant = 25 * 60;
let tempsTotal = 25 * 60;
let tempsDebut = 0; // Pour calculer le temps réellement écoulé
let graphiques = {};

// Configuration de sécurité
const motDePasseGitHub = "nahuyidi";

// Données depuis JSON
const integrationGithub = {
    "apiEndpoint": "https://api.github.com",
    "gistEndpoint": "https://api.github.com/gists",
    "frequenceSauvegarde": "apres_chaque_session",
    "parametresSync": {
        "sauvegardeAuto": true,
        "profilPublic": false,
        "partagerStatistiques": true
    }
};

const tournois = {
    "tournoiHebdomadaire": {
        "nom": "Défi Focus Hebdomadaire",
        "duree": "7 jours",
        "metrique": "temps_etude_total",
        "prix": ["500 points", "300 points", "200 points"]
    },
    "championnatMensuel": {
        "nom": "Maître de Concentration",
        "duree": "30 jours",
        "metrique": "jours_serie",
        "categories": ["Débutant", "Avancé", "Expert"]
    }
};

const ligues = [
    {"nom": "Bronze", "pointsMin": 0, "couleur": "#CD7F32"},
    {"nom": "Argent", "pointsMin": 1000, "couleur": "#C0C0C0"},
    {"nom": "Or", "pointsMin": 2500, "couleur": "#FFD700"},
    {"nom": "Platine", "pointsMin": 5000, "couleur": "#E5E4E2"},
    {"nom": "Diamant", "pointsMin": 10000, "couleur": "#B9F2FF"}
];

const statistiquesAvancees = {
    "objectifsHebdomadaires": 1800,
    "dureeSessionMoyenne": 28,
    "heurePlusProductive": 14,
    "recordSerie": 12,
    "typeMinuteurFavori": "pomodoro",
    "tempsPauseTotal": 420,
    "efficaciteFocus": 0.87,
    "tauxCompletion": 0.73,
    "sessionsCompletes": 18,
    "sessionsInterrompues": 6,
    "tempsReel": 1450,
    "tempsPrevu": 1800,
    "distributionCategories": {
        "mathématiques": 40,
        "programmation": 35,
        "langues": 20,
        "autre": 5
    }
};

// Configuration des minuteurs
const typesMinuteurs = {
    pomodoro: { tempsTravail: 25, pauseCourte: 5, pauseLongue: 15, cycles: 4 },
    deep: { tempsTravail: 90, pauseCourte: 20, pauseLongue: 30, cycles: 2 },
    sprint: { tempsTravail: 15, pauseCourte: 3, pauseLongue: 10, cycles: 6 },
    custom: { tempsTravail: 45, pauseCourte: 10, pauseLongue: 20, cycles: 3 }
};

// Succès
const succes = [
    { id: 'premier_minuteur', nom: 'Premier Minuteur', description: 'Complétez votre première session d\'étude', points: 50, icone: '🏆', debloque: false },
    { id: 'serie_5', nom: 'Série de 5', description: 'Étudiez pendant 5 jours consécutifs', points: 100, icone: '🔥', debloque: false },
    { id: 'oiseau_nuit', nom: 'Oiseau de Nuit', description: 'Étudiez après 22h00', points: 75, icone: '🦉', debloque: false },
    { id: 'leve_tot', nom: 'Lève-Tôt', description: 'Étudiez avant 7h00', points: 75, icone: '🐦', debloque: false },
    { id: 'maitre_focus', nom: 'Maître Focus', description: 'Complétez 50 sessions d\'étude', points: 200, icone: '🧠', debloque: false },
    { id: 'marathon', nom: 'Marathon', description: 'Étudiez 4h+ en une journée', points: 150, icone: '🏃', debloque: false },
    { id: 'sync_github', nom: 'Gardien du Cloud', description: 'Configurez la synchronisation GitHub', points: 100, icone: '🐙', debloque: false },
    { id: 'gagnant_tournoi', nom: 'Champion de Tournoi', description: 'Gagnez le tournoi hebdomadaire', points: 300, icone: '👑', debloque: false },
    { id: 'papillon_social', nom: 'Papillon Social', description: 'Ajoutez 5 amis', points: 75, icone: '🦋', debloque: false }
];

// Messages d'interface
const messagesInterface = {
    "sessionTerminee": "Session terminée! 🎉",
    "sessionInterrompue": "Session interrompue - {temps} min ajoutées aux stats",
    "pauseRecommandee": "Pause recommandée 💤",
    "objectifAtteint": "Objectif atteint! 🎯",
    "nouveauSucces": "Nouveau succès débloqué! 🏆",
    "batailleDisponible": "Bataille disponible! ⚔️",
    "tournoiCommence": "Le tournoi commence! 🏁",
    "motDePasseRequis": "Mot de passe d'administration :",
    "accesRefuse": "Accès refusé - mot de passe incorrect",
    "accesAutorise": "Accès autorisé aux paramètres GitHub"
};

// Initialisation de l'application
document.addEventListener('DOMContentLoaded', function() {
    initialiserApplication();
});

function initialiserApplication() {
    // Initialiser les utilisateurs globaux (ИСПРАВЛЕНО: pays -> etudes)
    utilisateursGlobaux = [
        {"nomUtilisateur": "Admin", "points": 1250, "ligue": "Argent", etudes: "Info"},
    ];

    // Initialiser les utilisateurs par défaut avec nouvelles statistiques
    utilisateurs.set('MaîtreÉtude', {
        nomUtilisateur: 'MaîtreÉtude',
        motDePasse: '123456',
        pointsTotaux: 1250,
        niveau: 5,
        serieActuelle: 7,
        tempsEtudeTotale: 1450, // temps réel étudié
        tempsPrevu: 1800, // temps total prévu
        sessionsCompletees: 18,
        sessionsInterrompues: 6,
        tauxCompletion: 73,
        succes: ['premier_minuteur', 'serie_5', 'oiseau_nuit', 'maitre_focus'],
        derniereConnexion: new Date().toLocaleDateString('fr-FR'),
        statistiquesQuotidiennes: genererStatistiquesExemple(),
        amis: ['RoiFocus', 'NinjaCode'],
        tokenGithub: '',
        syncGithubActive: false,
        acceGithubDebloque: false, // Nouvel état pour l'accès GitHub
        etudes: '', // ДОБАВЛЕНО: поле для etudes
        photo: '', // ДОБАВЛЕНО: поле для фото
        parametres: {
            sonActive: true,
            minuteurPersonnalise: {
                tempsTravail: 45,
                pauseCourte: 10,
                pauseLongue: 20,
                cycles: 3
            }
        }
    });

    // Lier les événements
    lierEvenements();

    // Afficher l'écran de connexion
    afficherEcran('login-screen');
}

function genererStatistiquesExemple() {
    const statistiques = {};
    const aujourdhui = new Date();
    for (let i = 6; i >= 0; i--) {
        const date = new Date(aujourdhui);
        date.setDate(date.getDate() - i);
        const dateStr = date.toDateString();
        statistiques[dateStr] = Math.floor(Math.random() * 200) + 60;
    }
    return statistiques;
}

function lierEvenements() {
    // Événements de connexion
    const formulaireConnexion = document.getElementById('login-form');
    const boutonInscription = document.getElementById('signup-btn');
    const boutonDeconnexion = document.getElementById('logout-btn');

    if (formulaireConnexion) formulaireConnexion.addEventListener('submit', gererConnexion);
    if (boutonInscription) boutonInscription.addEventListener('click', gererInscription);
    if (boutonDeconnexion) boutonDeconnexion.addEventListener('click', gererDeconnexion);

    // Événements de navigation
    const boutonsNav = document.querySelectorAll('.nav-btn');
    boutonsNav.forEach(bouton => {
        bouton.addEventListener('click', (e) => {
            const onglet = e.target.getAttribute('data-tab');
            // Vérifier si c'est l'onglet GitHub Sync
            if (onglet === 'githubsync') {
                verifierAccesGitHub();
            } else {
                afficherOnglet(onglet);
                mettreAJourNavigation(e.target);
            }
        });
    });

    // Événements du minuteur
    const boutonDemarrer = document.getElementById('start-btn');
    const boutonPause = document.getElementById('pause-btn');
    const boutonArreter = document.getElementById('stop-btn');
    const boutonPasser = document.getElementById('skip-btn');
    const selecteurTypeMinuteur = document.getElementById('timer-type');

    if (boutonDemarrer) boutonDemarrer.addEventListener('click', demarrerMinuteur);
    if (boutonPause) boutonPause.addEventListener('click', pauserMinuteur);
    if (boutonArreter) boutonArreter.addEventListener('click', arreterMinuteur);
    if (boutonPasser) boutonPasser.addEventListener('click', passerMinuteur);
    if (selecteurTypeMinuteur) selecteurTypeMinuteur.addEventListener('change', changerTypeMinuteur);

    // Événements de la modal de mot de passe GitHub
    const boutonDebloqueur = document.getElementById('unlock-github');
    const boutonFermerMdp = document.getElementById('close-password-modal');
    const boutonConfirmerMdp = document.getElementById('confirm-password');
    const boutonAnnulerMdp = document.getElementById('cancel-password');
    const champMotDePasse = document.getElementById('github-admin-password');

    if (boutonDebloqueur) boutonDebloqueur.addEventListener('click', () => afficherModal('github-password-modal'));
    if (boutonFermerMdp) boutonFermerMdp.addEventListener('click', () => masquerModal('github-password-modal'));
    if (boutonAnnulerMdp) boutonAnnulerMdp.addEventListener('click', () => masquerModal('github-password-modal'));
    if (boutonConfirmerMdp) boutonConfirmerMdp.addEventListener('click', verifierMotDePasseGitHub);
    if (champMotDePasse) {
        champMotDePasse.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                verifierMotDePasseGitHub();
            }
        });
    }

    // Événements des paramètres
    const travailPersonnalise = document.getElementById('custom-work');
    const pauseCourtePersonnalisee = document.getElementById('custom-short-break');
    const pauseLonguePersonnalisee = document.getElementById('custom-long-break');
    const caseASonActive = document.getElementById('sound-enabled');

    if (travailPersonnalise) travailPersonnalise.addEventListener('change', mettreAJourMinuteurPersonnalise);
    if (pauseCourtePersonnalisee) pauseCourtePersonnalisee.addEventListener('change', mettreAJourMinuteurPersonnalise);
    if (pauseLonguePersonnalisee) pauseLonguePersonnalisee.addEventListener('change', mettreAJourMinuteurPersonnalise);
    if (caseASonActive) caseASonActive.addEventListener('change', mettreAJourParametresSon);

    // Événements du profil
    const boutonExporter = document.getElementById('export-data');
    const boutonImporter = document.getElementById('import-data');
    const fichierImporter = document.getElementById('import-file');

    if (boutonExporter) boutonExporter.addEventListener('click', exporterDonneesUtilisateur);
    if (boutonImporter) boutonImporter.addEventListener('click', () => fichierImporter.click());
    if (fichierImporter) fichierImporter.addEventListener('change', importerDonneesUtilisateur);

    // Événements de la fenêtre modale du minuteur
    const fermerModalPersonnalise = document.getElementById('close-custom-modal');
    const sauvegarderMinuteurPersonnalise = document.getElementById('save-custom-timer');
    const annulerMinuteurPersonnalise = document.getElementById('cancel-custom-timer');

    if (fermerModalPersonnalise) fermerModalPersonnalise.addEventListener('click', () => masquerModal('custom-timer-modal'));
    if (annulerMinuteurPersonnalise) annulerMinuteurPersonnalise.addEventListener('click', () => masquerModal('custom-timer-modal'));
    if (sauvegarderMinuteurPersonnalise) sauvegarderMinuteurPersonnalise.addEventListener('click', sauvegarderParametresMinuteurPersonnalise);

    // Événements GitHub sync (seront disponibles après déverrouillage)
    const testerTokenGithub = document.getElementById('test-github-token');
    const demarrerSync = document.getElementById('start-sync');
    const restaurerDonneesGithub = document.getElementById('restore-github-data');
    const caseSauvegardeAuto = document.getElementById('auto-backup');
    const caseProfilPublic = document.getElementById('public-profile');
    const casePartagerStatistiques = document.getElementById('share-statistics');

    if (testerTokenGithub) testerTokenGithub.addEventListener('click', testerTokenGitHub);
    if (demarrerSync) demarrerSync.addEventListener('click', demarrerSyncGitHub);
    if (restaurerDonneesGithub) restaurerDonneesGithub.addEventListener('click', restaurerDepuisGitHub);
    if (caseSauvegardeAuto) caseSauvegardeAuto.addEventListener('change', mettreAJourParametresGitHub);
    if (caseProfilPublic) caseProfilPublic.addEventListener('change', mettreAJourParametresGitHub);
    if (casePartagerStatistiques) casePartagerStatistiques.addEventListener('change', mettreAJourParametresGitHub);

    // Événements des tournois
    const inscrireTournoiHebdomadaire = document.getElementById('register-weekly');
    if (inscrireTournoiHebdomadaire) inscrireTournoiHebdomadaire.addEventListener('click', inscrirePourTournoi);

    // Événements des amis
    const formulaireAjouterAmi = document.getElementById('add-friend-form');
    if (formulaireAjouterAmi) formulaireAjouterAmi.addEventListener('submit', ajouterAmi);
}

// Nouvelles fonctions de sécurité GitHub
function verifierAccesGitHub() {
    if (utilisateurActuel && utilisateurActuel.acceGithubDebloque) {
        // Accès déjà débloqué, aller directement à l'onglet
        afficherOnglet('githubsync');
        mettreAJourNavigation(document.querySelector('[data-tab="githubsync"]'));
    } else {
        // Demander le mot de passe
        afficherModal('github-password-modal');
        document.getElementById('github-admin-password').value = '';
        document.getElementById('password-error').classList.add('hidden');
    }
}

function verifierMotDePasseGitHub() {
    const motDePasse = document.getElementById('github-admin-password').value;
    const divErreur = document.getElementById('password-error');

    if (motDePasse === motDePasseGitHub) {
        // Mot de passe correct
        utilisateurActuel.acceGithubDebloque = true;
        masquerModal('github-password-modal');
        afficherOnglet('githubsync');
        mettreAJourNavigation(document.querySelector('[data-tab="githubsync"]'));
        afficherNotification(messagesInterface.accesAutorise, 'success');
    } else {
        // Mot de passe incorrect
        divErreur.textContent = messagesInterface.accesRefuse;
        divErreur.classList.remove('hidden');
        document.getElementById('github-admin-password').value = '';
        document.getElementById('github-admin-password').focus();
        jouerSon('error');
    }
}

// Fonctions d'authentification
function gererConnexion(e) {
    e.preventDefault();
    const nomUtilisateur = document.getElementById('username').value;
    const motDePasse = document.getElementById('password').value;

    if (utilisateurs.has(nomUtilisateur) && utilisateurs.get(nomUtilisateur).motDePasse === motDePasse) {
        utilisateurActuel = utilisateurs.get(nomUtilisateur);
        utilisateurActuel.derniereConnexion = new Date().toLocaleDateString('fr-FR');
        // Réinitialiser l'accès GitHub à chaque connexion
        utilisateurActuel.acceGithubDebloque = false;

        afficherEcran('main-screen');
        mettreAJourInterfaceUtilisateur();
        afficherNotification('Bienvenue, ' + nomUtilisateur + '!', 'success');
    } else {
        afficherNotification('Nom d\'utilisateur ou mot de passe incorrect', 'error');
    }
}

function gererInscription() {
    const nomUtilisateur = document.getElementById('username').value;
    const motDePasse = document.getElementById('password').value;

    if (!nomUtilisateur || !motDePasse) {
        afficherNotification('Veuillez entrer un nom d\'utilisateur et un mot de passe', 'error');
        return;
    }

    if (utilisateurs.has(nomUtilisateur)) {
        afficherNotification('L\'utilisateur existe déjà', 'error');
        return;
    }

    const nouvelUtilisateur = {
        nomUtilisateur: nomUtilisateur,
        motDePasse: motDePasse,
        pointsTotaux: 0,
        niveau: 1,
        serieActuelle: 0,
        tempsEtudeTotale: 0,
        tempsPrevu: 0,
        sessionsCompletees: 0,
        sessionsInterrompues: 0,
        tauxCompletion: 0,
        succes: [],
        derniereConnexion: new Date().toLocaleDateString('fr-FR'),
        statistiquesQuotidiennes: {},
        amis: [],
        tokenGithub: '',
        syncGithubActive: false,
        acceGithubDebloque: false,
        etudes: '', // ДОБАВЛЕНО: поле для etudes
        photo: '', // ДОБАВЛЕНО: поле для фото
        parametres: {
            sonActive: true,
            minuteurPersonnalise: {
                tempsTravail: 45,
                pauseCourte: 10,
                pauseLongue: 20,
                cycles: 3
            }
        }
    };

    utilisateurs.set(nomUtilisateur, nouvelUtilisateur);
    // ИСПРАВЛЕНО: pays -> etudes
    utilisateursGlobaux.push({nomUtilisateur: nomUtilisateur, points: 0, ligue: "Bronze", etudes: ""});

    utilisateurActuel = nouvelUtilisateur;
    afficherEcran('main-screen');
    mettreAJourInterfaceUtilisateur();
    afficherNotification('Compte créé avec succès!', 'success');
}

function gererDeconnexion() {
    utilisateurActuel = null;
    arreterMinuteur();
    afficherEcran('login-screen');
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
}

// Fonctions de navigation
function afficherEcran(idEcran) {
    const ecrans = document.querySelectorAll('.screen');
    ecrans.forEach(ecran => ecran.classList.remove('active'));
    document.getElementById(idEcran).classList.add('active');
}

function afficherOnglet(idOnglet) {
    const onglets = document.querySelectorAll('.tab-content');
    onglets.forEach(onglet => onglet.classList.remove('active'));
    document.getElementById(idOnglet + '-tab').classList.add('active');

    if (idOnglet === 'statistics') {
        rendreStatistiquesAvancees();
    } else if (idOnglet === 'achievements') {
        rendreSucces();
    } else if (idOnglet === 'settings') {
        mettreAJourInterfaceParametres();
    } else if (idOnglet === 'profile') {
        mettreAJourInterfaceProfil();
    } else if (idOnglet === 'tournaments') {
        rendreTournois();
    } else if (idOnglet === 'leaderboards') {
        rendreClassements();
    } else if (idOnglet === 'friends') {
        rendreAmis();
    } else if (idOnglet === 'githubsync') {
        rendreSyncGitHub();
    }
}

function mettreAJourNavigation(boutonActif) {
    const boutonsNav = document.querySelectorAll('.nav-btn');
    boutonsNav.forEach(bouton => bouton.classList.remove('active'));
    boutonActif.classList.add('active');
}

// Fonctions du minuteur avec nouvelle logique de skip (ИСПРАВЛЕНО)
function demarrerMinuteur() {
    if (!minuteurEnCours) {
        minuteurEnCours = true;
        tempsDebut = Date.now(); // Marquer le temps de début
        mettreAJourControlesMinuteur();

        intervalleMinuteur = setInterval(() => {
            tempsRestant--;
            mettreAJourAffichageMinuteur();
            mettreAJourBarreProgres();

            if (tempsRestant <= 0) {
                minuteurTermine();
            }
        }, 1000);

        jouerSon('start');
    }
}

function pauserMinuteur() {
    if (minuteurEnCours) {
        minuteurEnCours = false;
        clearInterval(intervalleMinuteur);
        mettreAJourControlesMinuteur();
    }
}

function arreterMinuteur() {
    minuteurEnCours = false;
    clearInterval(intervalleMinuteur);
    reinitialiserMinuteur();
    mettreAJourControlesMinuteur();
    mettreAJourAffichageMinuteur();
    mettreAJourBarreProgres();
}

// ИСПРАВЛЕНО: функция passerMinuteur для правильного подсчета времени при skip
function passerMinuteur() {
    // Calculer les secondes réellement écoulées
    const secondesEcoulees = Math.max(0, tempsTotal - tempsRestant);
    const tempsEcouleMin = Math.floor(secondesEcoulees / 60);

    if (phaseActuelle === 'work') {
        if (tempsEcouleMin > 0) {
            ajouterSessionEtudeInterrompue(tempsEcouleMin);
            const message = messagesInterface.sessionInterrompue.replace('{temps}', tempsEcouleMin);
            afficherNotification(message, 'info');
            verifierSucces();
        }
    }

    // Arrêter le minuteur
    clearInterval(intervalleMinuteur);
    minuteurEnCours = false;

    // Passer à la phase suivante sans créditer la session complète
    passerAPhasesuivante();

    // Mettre à jour l'interface
    mettreAJourControlesMinuteur();
    mettreAJourAffichageMinuteur();
    mettreAJourBarreProgres();
}

function reinitialiserMinuteur() {
    const config = typesMinuteurs[typeMinuteurActuel];
    phaseActuelle = 'work';
    cycleActuel = 1;
    tempsRestant = config.tempsTravail * 60;
    tempsTotal = config.tempsTravail * 60;
    tempsDebut = 0;
    document.getElementById('timer-session').textContent = 'Travail';
}

function minuteurTermine() {
    clearInterval(intervalleMinuteur);
    minuteurEnCours = false;
    jouerSon('complete');

    if (phaseActuelle === 'work') {
        const tempsSession = Math.floor(tempsTotal / 60);
        ajouterSessionEtude(tempsSession);
        verifierSucces();

        // Sauvegarde automatique GitHub si activée
        if (utilisateurActuel.syncGithubActive && utilisateurActuel.tokenGithub) {
            sauvegarderVersGitHub();
        }

        afficherNotification(messagesInterface.sessionTerminee, 'success');
    }

    passerAPhasesuivante();
    mettreAJourControlesMinuteur();
    mettreAJourAffichageMinuteur();
    mettreAJourBarreProgres();
}

function passerAPhasesuivante() {
    const config = typesMinuteurs[typeMinuteurActuel];

    if (phaseActuelle === 'work') {
        if (cycleActuel >= config.cycles) {
            phaseActuelle = 'longBreak';
            tempsRestant = config.pauseLongue * 60;
            tempsTotal = config.pauseLongue * 60;
            document.getElementById('timer-session').textContent = 'Pause Longue';
            cycleActuel = 1;
        } else {
            phaseActuelle = 'shortBreak';
            tempsRestant = config.pauseCourte * 60;
            tempsTotal = config.pauseCourte * 60;
            document.getElementById('timer-session').textContent = 'Pause Courte';
        }
        afficherNotification(messagesInterface.pauseRecommandee, 'info');
    } else {
        phaseActuelle = 'work';
        tempsRestant = config.tempsTravail * 60;
        tempsTotal = config.tempsTravail * 60;
        document.getElementById('timer-session').textContent = 'Travail';
        if (phaseActuelle !== 'longBreak') {
            cycleActuel++;
        }
    }
    tempsDebut = 0; // Réinitialiser pour la prochaine phase
}

function changerTypeMinuteur() {
    const selecteur = document.getElementById('timer-type');
    const nouveauType = selecteur.value;

    if (nouveauType === 'custom') {
        afficherModal('custom-timer-modal');
        return;
    }

    typeMinuteurActuel = nouveauType;
    arreterMinuteur();
    reinitialiserMinuteur();
    mettreAJourAffichageTypeMinuteur();
}

function mettreAJourAffichageTypeMinuteur() {
    const nomsTypes = {
        pomodoro: 'Pomodoro',
        deep: 'Concentration Profonde',
        sprint: 'Sprint Rapide',
        custom: 'Personnalisé'
    };
    document.getElementById('current-timer-type').textContent = nomsTypes[typeMinuteurActuel];
}

function mettreAJourAffichageMinuteur() {
    const minutes = Math.floor(tempsRestant / 60);
    const secondes = tempsRestant % 60;
    const affichage = `${minutes.toString().padStart(2, '0')}:${secondes.toString().padStart(2, '0')}`;
    document.getElementById('time-display').textContent = affichage;
}

function mettreAJourBarreProgres() {
    const progres = ((tempsTotal - tempsRestant) / tempsTotal) * 100;
    document.getElementById('progress-fill').style.width = progres + '%';
}

function mettreAJourControlesMinuteur() {
    const boutonDemarrer = document.getElementById('start-btn');
    const boutonPause = document.getElementById('pause-btn');

    if (minuteurEnCours) {
        boutonDemarrer.classList.add('hidden');
        boutonPause.classList.remove('hidden');
    } else {
        boutonDemarrer.classList.remove('hidden');
        boutonPause.classList.add('hidden');
    }
}

// Nouvelles fonctions des statistiques avec gestion des sessions interrompues
function ajouterSessionEtude(minutes) {
    if (!utilisateurActuel) return;

    utilisateurActuel.tempsEtudeTotale += minutes;
    utilisateurActuel.tempsPrevu += minutes;
    utilisateurActuel.sessionsCompletees++;

    const aujourdhui = new Date().toDateString();
    if (!utilisateurActuel.statistiquesQuotidiennes[aujourdhui]) {
        utilisateurActuel.statistiquesQuotidiennes[aujourdhui] = 0;
    }
    utilisateurActuel.statistiquesQuotidiennes[aujourdhui] += minutes;

    const points = minutes * 2;
    ajouterPoints(points);
    calculerTauxCompletion();
    mettreAJourInterfaceUtilisateur();
}

// ИСПРАВЛЕНО: функция ajouterSessionEtudeInterrompue для корректного подсчета прерванных сессий
function ajouterSessionEtudeInterrompue(minutes) {
    if (!utilisateurActuel) return;

    // Ajouter uniquement le temps réel étudié
    utilisateurActuel.tempsEtudeTotale += minutes;

    // NE PAS ajouter de temps prévu pour une session interrompue
    // utilisateurActuel.tempsPrevu += ... (supprimé)

    utilisateurActuel.sessionsInterrompues++;

    const aujourdhui = new Date().toDateString();
    if (!utilisateurActuel.statistiquesQuotidiennes[aujourdhui]) {
        utilisateurActuel.statistiquesQuotidiennes[aujourdhui] = 0;
    }
    utilisateurActuel.statistiquesQuotidiennes[aujourdhui] += minutes;

    // Points réduits pour les sessions interrompues
    const points = minutes * 1;
    ajouterPoints(points);
    calculerTauxCompletion();
    mettreAJourInterfaceUtilisateur();
}

function calculerTauxCompletion() {
    if (!utilisateurActuel) return;

    const totalSessions = utilisateurActuel.sessionsCompletees + utilisateurActuel.sessionsInterrompues;
    if (totalSessions > 0) {
        utilisateurActuel.tauxCompletion = Math.round((utilisateurActuel.sessionsCompletees / totalSessions) * 100);
    }
}

function ajouterPoints(points) {
    if (!utilisateurActuel) return;

    utilisateurActuel.pointsTotaux += points;

    // Mettre à jour le classement global
    const utilisateurGlobal = utilisateursGlobaux.find(u => u.nomUtilisateur === utilisateurActuel.nomUtilisateur);
    if (utilisateurGlobal) {
        utilisateurGlobal.points = utilisateurActuel.pointsTotaux;
        utilisateurGlobal.ligue = obtenirLigueUtilisateur(utilisateurActuel.pointsTotaux);
    }

    const nouveauNiveau = Math.floor(utilisateurActuel.pointsTotaux / 100) + 1;
    if (nouveauNiveau > utilisateurActuel.niveau) {
        utilisateurActuel.niveau = nouveauNiveau;
        afficherNotification(`Félicitations! Vous avez atteint le niveau ${nouveauNiveau}!`, 'success');
    }
}

function obtenirLigueUtilisateur(points) {
    for (let i = ligues.length - 1; i >= 0; i--) {
        if (points >= ligues[i].pointsMin) {
            return ligues[i].nom;
        }
    }
    return ligues[0].nom;
}

function mettreAJourInterfaceUtilisateur() {
    if (!utilisateurActuel) return;

    document.getElementById('current-username').textContent = utilisateurActuel.nomUtilisateur;
    document.getElementById('user-level').textContent = utilisateurActuel.niveau;
    document.getElementById('user-points').textContent = utilisateurActuel.pointsTotaux;
    document.getElementById('current-streak').textContent = utilisateurActuel.serieActuelle;
    document.getElementById('sessions-completed').textContent = utilisateurActuel.sessionsCompletees;
    document.getElementById('completion-rate').textContent = utilisateurActuel.tauxCompletion;

    const aujourdhui = new Date().toDateString();
    const minutesAujourdhui = utilisateurActuel.statistiquesQuotidiennes[aujourdhui] || 0;
    document.getElementById('today-time').textContent = minutesAujourdhui;

    // Mettre à jour les nouvelles statistiques
    const completeSessionsEl = document.getElementById('complete-sessions');
    const interruptedSessionsEl = document.getElementById('interrupted-sessions');
    const realTimeEl = document.getElementById('real-time');
    const plannedTimeEl = document.getElementById('planned-time');

    if (completeSessionsEl) completeSessionsEl.textContent = utilisateurActuel.sessionsCompletees;
    if (interruptedSessionsEl) interruptedSessionsEl.textContent = utilisateurActuel.sessionsInterrompues;
    if (realTimeEl) realTimeEl.textContent = utilisateurActuel.tempsEtudeTotale;
    if (plannedTimeEl) plannedTimeEl.textContent = utilisateurActuel.tempsPrevu;

    rendreSuccesRecents();
}

function rendreSuccesRecents() {
    const conteneur = document.getElementById('recent-achievements');
    if (!conteneur) return;

    conteneur.innerHTML = '';
    const succesDesbloques = succes.filter(s => utilisateurActuel.succes.includes(s.id)).slice(-3);

    succesDesbloques.forEach(succes => {
        const badge = document.createElement('div');
        badge.className = 'achievement-badge';
        badge.innerHTML = `
            <span class="achievement-icon">${succes.icone}</span>
            <span class="achievement-name">${succes.nom}</span>
        `;
        conteneur.appendChild(badge);
    });
}

// Fonctions des statistiques avancées avec nouveau graphique de complétion
function rendreStatistiquesAvancees() {
    rendreGraphiqueEfficaciteHebdomadaire();
    rendreGraphiqueCompletion();
    rendreGraphiqueCategories();
    rendreGraphiqueCorrelation();
}

function rendreGraphiqueEfficaciteHebdomadaire() {
    const ctx = document.querySelector('#chart-week canvas');
    if (!ctx) return;

    if (graphiques.graphiqueHebdomadaire) {
        graphiques.graphiqueHebdomadaire.destroy();
    }

    const donneesHebdomadaires = [];
    const etiquettes = [];
    const aujourdhui = new Date();

    for (let i = 6; i >= 0; i--) {
        const date = new Date(aujourdhui);
        date.setDate(date.getDate() - i);
        const dateStr = date.toDateString();
        const nomJour = date.toLocaleDateString('fr', { weekday: 'short' });
        etiquettes.push(nomJour);
        donneesHebdomadaires.push(utilisateurActuel.statistiquesQuotidiennes[dateStr] || 0);
    }

    graphiques.graphiqueHebdomadaire = new Chart(ctx, {
        type: 'line',
        data: {
            labels: etiquettes,
            datasets: [{
                label: 'Minutes d\'étude',
                data: donneesHebdomadaires,
                borderColor: '#FF69B4',
                backgroundColor: 'rgba(255, 105, 180, 0.1)',
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        color: '#ffffff',
                        font: { size: 10 }
                    }
                }
            },
            scales: {
                y: {
                    ticks: {
                        color: '#cccccc',
                        font: { size: 10 }
                    },
                    grid: { color: '#444444' }
                },
                x: {
                    ticks: {
                        color: '#cccccc',
                        font: { size: 10 }
                    },
                    grid: { color: '#444444' }
                }
            }
        }
    });
}

function rendreGraphiqueCompletion() {
    const ctx = document.querySelector('#chart-completion canvas');
    if (!ctx) return;

    if (graphiques.graphiqueCompletion) {
        graphiques.graphiqueCompletion.destroy();
    }

    const sessionsCompletes = utilisateurActuel.sessionsCompletees;
    const sessionsInterrompues = utilisateurActuel.sessionsInterrompues;

    graphiques.graphiqueCompletion = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Sessions complètes', 'Sessions interrompues'],
            datasets: [{
                data: [sessionsCompletes, sessionsInterrompues],
                backgroundColor: ['#1FB8CD', '#FFC185'],
                borderColor: ['#1FB8CD', '#FFC185'],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        color: '#ffffff',
                        font: { size: 10 }
                    }
                }
            }
        }
    });
}

function rendreGraphiqueCategories() {
    const ctx = document.querySelector('#chart-categories canvas');
    if (!ctx) return;

    if (graphiques.graphiqueCategories) {
        graphiques.graphiqueCategories.destroy();
    }

    graphiques.graphiqueCategories = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(statistiquesAvancees.distributionCategories),
            datasets: [{
                data: Object.values(statistiquesAvancees.distributionCategories),
                backgroundColor: ['#1FB8CD', '#FFC185', '#B4413C', '#ECEBD5']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        color: '#ffffff',
                        font: { size: 10 }
                    }
                }
            }
        }
    });
}

function rendreGraphiqueCorrelation() {
    const ctx = document.querySelector('#chart-correlation canvas');
    if (!ctx) return;

    if (graphiques.graphiqueCorrelation) {
        graphiques.graphiqueCorrelation.destroy();
    }

    // Simulation des données de corrélation
    const donneesCorrelation = [
        { x: 10, y: 15 }, { x: 20, y: 25 }, { x: 30, y: 45 },
        { x: 40, y: 55 }, { x: 50, y: 65 }, { x: 60, y: 75 }
    ];

    graphiques.graphiqueCorrelation = new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: [{
                label: 'Temps d\'étude vs Pauses',
                data: donneesCorrelation,
                backgroundColor: '#DDA0DD',
                borderColor: '#FF69B4'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        color: '#ffffff',
                        font: { size: 10 }
                    }
                }
            },
            scales: {
                y: {
                    ticks: {
                        color: '#cccccc',
                        font: { size: 10 }
                    },
                    grid: { color: '#444444' }
                },
                x: {
                    ticks: {
                        color: '#cccccc',
                        font: { size: 10 }
                    },
                    grid: { color: '#444444' }
                }
            }
        }
    });
}

// Fonctions des tournois
function rendreTournois() {
    document.getElementById('weekly-t-name').textContent = tournois.tournoiHebdomadaire.nom;
    document.getElementById('bracket-container').innerHTML = '<p>Les participants seront affichés après l\'inscription</p>';
}

function inscrirePourTournoi() {
    afficherNotification('Vous êtes inscrit au tournoi!', 'success');
    document.getElementById('register-weekly').textContent = 'Inscrit';
    document.getElementById('register-weekly').disabled = true;
}

// Fonctions des classements (ИСПРАВЛЕНО: pays -> etudes)
function rendreClassements() {
    const tbody = document.querySelector('#global-leaderboard tbody');
    if (!tbody) return;

    tbody.innerHTML = '';

    // Tri par points
    const utilisateursTries = [...utilisateursGlobaux].sort((a, b) => b.points - a.points);

    utilisateursTries.forEach((utilisateur, index) => {
        const rangee = document.createElement('tr');
        rangee.innerHTML = `
            <td>${index + 1}</td>
            <td>${utilisateur.nomUtilisateur}</td>
            <td>${utilisateur.points}</td>
            <td>${utilisateur.ligue}</td>
            <td>${utilisateur.etudes}</td>
        `;
        tbody.appendChild(rangee);
    });
}

// Fonctions des amis
function rendreAmis() {
    const listeAmis = document.getElementById('friends-list-container');
    const serieGroupe = document.getElementById('group-streak');

    if (!listeAmis) return;

    if (utilisateurActuel.amis.length === 0) {
        listeAmis.innerHTML = '<p>Vous n\'avez pas encore d\'amis. Ajoutez des amis pour étudier ensemble!</p>';
    } else {
        utilisateurActuel.amis.forEach(nomAmi => {
            const divAmi = document.createElement('div');
            divAmi.style.cssText = 'padding: 8px; margin: 4px 0; background: var(--y2k-surface-light); border-radius: 4px; font-size: 10px;';
            divAmi.innerHTML = `👤 ${nomAmi} - En ligne`;
            listeAmis.appendChild(divAmi);
        });
    }

    if (serieGroupe) {
        serieGroupe.innerHTML = '<p>Vous et vos amis étudiez ensemble depuis 3 jours consécutifs!</p>';
    }
}

function ajouterAmi(e) {
    e.preventDefault();
    const nomUtilisateurAmi = document.getElementById('friend-username').value.trim();

    if (!nomUtilisateurAmi) {
        afficherNotification('Veuillez entrer un nom d\'utilisateur', 'error');
        return;
    }

    if (nomUtilisateurAmi === utilisateurActuel.nomUtilisateur) {
        afficherNotification('Vous ne pouvez pas vous ajouter vous-même comme ami', 'error');
        return;
    }

    if (utilisateurActuel.amis.includes(nomUtilisateurAmi)) {
        afficherNotification('Cet utilisateur est déjà dans vos amis', 'error');
        return;
    }

    // Vérifier l'existence de l'utilisateur dans la base globale
    const amiExiste = utilisateursGlobaux.some(u => u.nomUtilisateur === nomUtilisateurAmi);
    if (!amiExiste) {
        afficherNotification('Utilisateur introuvable', 'error');
        return;
    }

    utilisateurActuel.amis.push(nomUtilisateurAmi);
    document.getElementById('friend-username').value = '';
    rendreAmis();
    verifierSucces();
    afficherNotification(`${nomUtilisateurAmi} ajouté aux amis!`, 'success');
}

// Fonctions de synchronisation GitHub avec nouveau système de sécurité
function rendreSyncGitHub() {
    const contenuVerrouille = document.getElementById('github-locked-content');
    const contenuDebloque = document.getElementById('github-unlocked-content');
    const divStatut = document.getElementById('github-status');

    if (!utilisateurActuel) return;

    if (utilisateurActuel.acceGithubDebloque) {
        // Afficher le contenu débloqué
        contenuVerrouille.style.display = 'none';
        contenuDebloque.classList.remove('hidden');

        if (divStatut) {
            if (utilisateurActuel.syncGithubActive) {
                divStatut.innerHTML = '✅ Synchronisation active';
            } else {
                divStatut.innerHTML = '❌ Synchronisation non configurée';
            }
        }

        // Charger les paramètres
        document.getElementById('auto-backup').checked = true;
        document.getElementById('public-profile').checked = false;
        document.getElementById('share-statistics').checked = true;
    } else {
        // Afficher le contenu verrouillé
        contenuVerrouille.style.display = 'flex';
        contenuDebloque.classList.add('hidden');
    }
}

function testerTokenGitHub() {
    const token = document.getElementById('github-token').value;
    if (!token) {
        afficherNotification('Veuillez entrer un token GitHub', 'error');
        return;
    }

    // Simulation de vérification du token
    setTimeout(() => {
        afficherNotification('Token vérifié avec succès!', 'success');
        document.getElementById('github-status').innerHTML = '✅ Token valide';
    }, 1000);
}

function demarrerSyncGitHub() {
    const token = document.getElementById('github-token').value;
    if (!token) {
        afficherNotification('Veuillez d\'abord entrer et vérifier le token', 'error');
        return;
    }

    utilisateurActuel.tokenGithub = token;
    utilisateurActuel.syncGithubActive = true;

    // Débloquer le succès
    if (!utilisateurActuel.succes.includes('sync_github')) {
        utilisateurActuel.succes.push('sync_github');
        ajouterPoints(100);
        afficherNotification('Succès débloqué : Gardien du Cloud!', 'success');
    }

    sauvegarderVersGitHub();
    rendreSyncGitHub();
}

function sauvegarderVersGitHub() {
    if (!utilisateurActuel.syncGithubActive) return;

    // Simulation de sauvegarde
    setTimeout(() => {
        afficherNotification('Données sauvegardées sur GitHub!', 'success');
        document.getElementById('github-status').innerHTML = '✅ Dernière sauvegarde : ' + new Date().toLocaleTimeString('fr-FR');
    }, 1500);
}

function restaurerDepuisGitHub() {
    if (!utilisateurActuel.tokenGithub) {
        afficherNotification('Veuillez d\'abord configurer le token GitHub', 'error');
        return;
    }

    // Simulation de restauration
    setTimeout(() => {
        afficherNotification('Données restaurées depuis GitHub!', 'success');
        mettreAJourInterfaceUtilisateur();
    }, 1500);
}

function mettreAJourParametresGitHub() {
    const sauvegardeAuto = document.getElementById('auto-backup').checked;
    const profilPublic = document.getElementById('public-profile').checked;
    const partagerStatistiques = document.getElementById('share-statistics').checked;

    if (utilisateurActuel) {
        utilisateurActuel.parametresGithub = {
            sauvegardeAuto,
            profilPublic,
            partagerStatistiques
        };
    }
}

// Fonctions des succès
function rendreSucces() {
    const grille = document.getElementById('achievements-grid');
    if (!grille) return;

    grille.innerHTML = '';

    succes.forEach(succes => {
        const carte = document.createElement('div');
        const estDebloque = utilisateurActuel.succes.includes(succes.id);
        carte.className = `achievement-card ${estDebloque ? 'unlocked' : 'locked'}`;
        carte.innerHTML = `
            <div class="achievement-icon">${succes.icone}</div>
            <div class="achievement-info">
                <h4>${succes.nom}</h4>
                <p>${succes.description}</p>
                <span class="achievement-points">${succes.points} points</span>
            </div>
        `;
        grille.appendChild(carte);
    });
}

function verifierSucces() {
    if (!utilisateurActuel) return;

    // Premier minuteur
    if (!utilisateurActuel.succes.includes('premier_minuteur') && utilisateurActuel.sessionsCompletees >= 1) {
        debloquerSucces('premier_minuteur');
    }

    // Série de 5
    if (!utilisateurActuel.succes.includes('serie_5') && utilisateurActuel.serieActuelle >= 5) {
        debloquerSucces('serie_5');
    }

    // Maître focus
    if (!utilisateurActuel.succes.includes('maitre_focus') && utilisateurActuel.sessionsCompletees >= 50) {
        debloquerSucces('maitre_focus');
    }

    // Marathon
    const aujourdhui = new Date().toDateString();
    const minutesAujourdhui = utilisateurActuel.statistiquesQuotidiennes[aujourdhui] || 0;
    if (!utilisateurActuel.succes.includes('marathon') && minutesAujourdhui >= 240) {
        debloquerSucces('marathon');
    }

    // Papillon social
    if (!utilisateurActuel.succes.includes('papillon_social') && utilisateurActuel.amis.length >= 5) {
        debloquerSucces('papillon_social');
    }

    // Vérification des heures pour oiseau de nuit et lève-tôt
    const heureActuelle = new Date().getHours();
    if (!utilisateurActuel.succes.includes('oiseau_nuit') && heureActuelle >= 22) {
        debloquerSucces('oiseau_nuit');
    }
    if (!utilisateurActuel.succes.includes('leve_tot') && heureActuelle < 7) {
        debloquerSucces('leve_tot');
    }
}

function debloquerSucces(idSucces) {
    if (utilisateurActuel.succes.includes(idSucces)) return;

    const succes = succes.find(s => s.id === idSucces);
    if (!succes) return;

    utilisateurActuel.succes.push(idSucces);
    ajouterPoints(succes.points);
    afficherNotification(`${messagesInterface.nouveauSucces} ${succes.nom}`, 'success');
}

// Fonctions des paramètres
function mettreAJourInterfaceParametres() {
    if (!utilisateurActuel) return;

    document.getElementById('sound-enabled').checked = utilisateurActuel.parametres.sonActive;
    document.getElementById('custom-work').value = utilisateurActuel.parametres.minuteurPersonnalise.tempsTravail;
    document.getElementById('custom-short-break').value = utilisateurActuel.parametres.minuteurPersonnalise.pauseCourte;
    document.getElementById('custom-long-break').value = utilisateurActuel.parametres.minuteurPersonnalise.pauseLongue;
}

function mettreAJourParametresSon() {
    if (!utilisateurActuel) return;
    utilisateurActuel.parametres.sonActive = document.getElementById('sound-enabled').checked;
}

function mettreAJourMinuteurPersonnalise() {
    if (!utilisateurActuel) return;

    utilisateurActuel.parametres.minuteurPersonnalise.tempsTravail = parseInt(document.getElementById('custom-work').value);
    utilisateurActuel.parametres.minuteurPersonnalise.pauseCourte = parseInt(document.getElementById('custom-short-break').value);
    utilisateurActuel.parametres.minuteurPersonnalise.pauseLongue = parseInt(document.getElementById('custom-long-break').value);

    // Mettre à jour la configuration
    typesMinuteurs.custom = {
        tempsTravail: utilisateurActuel.parametres.minuteurPersonnalise.tempsTravail,
        pauseCourte: utilisateurActuel.parametres.minuteurPersonnalise.pauseCourte,
        pauseLongue: utilisateurActuel.parametres.minuteurPersonnalise.pauseLongue,
        cycles: 3
    };
}

function sauvegarderParametresMinuteurPersonnalise() {
    const tempsTravail = parseInt(document.getElementById('modal-work-time').value);
    const pauseCourte = parseInt(document.getElementById('modal-short-break').value);
    const pauseLongue = parseInt(document.getElementById('modal-long-break').value);
    const cycles = parseInt(document.getElementById('modal-cycles').value);

    typesMinuteurs.custom = { tempsTravail, pauseCourte, pauseLongue, cycles };
    typeMinuteurActuel = 'custom';

    if (utilisateurActuel) {
        utilisateurActuel.parametres.minuteurPersonnalise = { tempsTravail, pauseCourte, pauseLongue, cycles };
    }

    arreterMinuteur();
    reinitialiserMinuteur();
    mettreAJourAffichageTypeMinuteur();
    masquerModal('custom-timer-modal');
    afficherNotification('Minuteur personnalisé sauvegardé!', 'success');
}

// ИСПРАВЛЕНО: функция mettreAJourInterfaceProfil с поддержкой etudes и photo
function mettreAJourInterfaceProfil() {
    if (!utilisateurActuel) return;

    document.getElementById('profile-username').textContent = utilisateurActuel.nomUtilisateur;
    document.getElementById('profile-level').textContent = utilisateurActuel.niveau;
    document.getElementById('profile-points').textContent = utilisateurActuel.pointsTotaux;
    document.getElementById('last-login').textContent = utilisateurActuel.derniereConnexion;

    // Заполнить поле etudes
    const etudesInput = document.getElementById('profile-etudes');
    if (etudesInput) {
        etudesInput.value = utilisateurActuel.etudes || '';
    }

    // Заполнить фото пользователя
    const userPhoto = document.getElementById('user-photo');
    if (userPhoto) {
        userPhoto.src = utilisateurActuel.photo || 'default.png';
    }
}

// Fonctions du profil - Export/Import
function exporterDonneesUtilisateur() {
    if (!utilisateurActuel) return;

    const donnees = JSON.stringify(utilisateurActuel, null, 2);
    const blob = new Blob([donnees], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const lien = document.createElement('a');
    lien.href = url;
    lien.download = `studytime-${utilisateurActuel.nomUtilisateur}-${new Date().toISOString().split('T')[0]}.json`;
    lien.click();

    URL.revokeObjectURL(url);
    afficherNotification('Données exportées avec succès!', 'success');
}

function importerDonneesUtilisateur(e) {
    const fichier = e.target.files[0];
    if (!fichier) return;

    const lecteur = new FileReader();
    lecteur.onload = function(event) {
        try {
            const donneesImportees = JSON.parse(event.target.result);
            
            // Validation de base des données
            if (donneesImportees.nomUtilisateur && donneesImportees.pointsTotaux !== undefined) {
                Object.assign(utilisateurActuel, donneesImportees);
                mettreAJourInterfaceUtilisateur();
                mettreAJourInterfaceProfil();
                afficherNotification('Données importées avec succès!', 'success');
            } else {
                throw new Error('Format de fichier invalide');
            }
        } catch (error) {
            afficherNotification('Erreur lors de l\'importation du fichier', 'error');
        }
    };
    lecteur.readAsText(fichier);
}

// Fonctions utilitaires
function afficherModal(idModal) {
    document.getElementById(idModal).classList.remove('hidden');
}

function masquerModal(idModal) {
    document.getElementById(idModal).classList.add('hidden');
}

function afficherNotification(message, type = 'info') {
    const conteneur = document.getElementById('notifications-container');
    if (!conteneur) return;

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        padding: 12px 16px;
        margin: 8px;
        border-radius: 4px;
        color: white;
        font-size: 12px;
        opacity: 0;
        transform: translateY(-20px);
        transition: all 0.3s ease;
        ${type === 'success' ? 'background: #4CAF50;' : ''}
        ${type === 'error' ? 'background: #f44336;' : ''}
        ${type === 'info' ? 'background: #2196F3;' : ''}
    `;

    conteneur.appendChild(notification);

    // Animation d'entrée
    setTimeout(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateY(0)';
    }, 10);

    // Suppression automatique
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateY(-20px)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

function jouerSon(type) {
    if (!utilisateurActuel || !utilisateurActuel.parametres.sonActive) return;

    const audio = document.getElementById(`sound-${type}`);
    if (audio) {
        audio.currentTime = 0;
        audio.play().catch(e => console.warn('Cannot play sound:', e));
    }
}

// Fonctions d'ajout photo et gestion des GitHub Gists
function sauvegarderPhotoProfilDansGist(nomUtilisateur, photoBase64, token) {
    // Simulation de sauvegarde dans GitHub Gist
    console.log('Sauvegarde de la photo dans GitHub Gist pour', nomUtilisateur);
}

// Gestionnaires d'événements pour les fonctionnalités etudes et photo
// ИСПРАВЛЕНО: переместили обработчики в конец и добавили задержку
document.addEventListener('DOMContentLoaded', function() {
    // Задержка для полной загрузки DOM
    setTimeout(() => {
        // Обработчик Enter для поля etudes
        const etudesInput = document.getElementById('profile-etudes');
        if (etudesInput) {
            etudesInput.addEventListener('keydown', function(e) {
                if (e.key === 'Enter') {
                    if (utilisateurActuel) {
                        utilisateurActuel.etudes = this.value.trim();
                        mettreAJourInterfaceProfil();
                        afficherNotification('Etudes mises à jour !', 'success');
                    }
                }
            });
        }

        // Обработчик загрузки фото
        const photoInput = document.getElementById('photo-upload');
        if (photoInput) {
            photoInput.addEventListener('change', function(e) {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = function(ev) {
                        const userPhoto = document.getElementById('user-photo');
                        if (userPhoto) {
                            userPhoto.src = ev.target.result;
                        }

                        // Сохраняем фото в профиль (base64)
                        if (utilisateurActuel) {
                            utilisateurActuel.photo = ev.target.result;

                            // Сохраняем фото в localStorage
                            try {
                                localStorage.setItem('userPhoto_' + utilisateurActuel.nomUtilisateur, ev.target.result);
                            } catch (e) {
                                console.warn('Ошибка сохранения фото в localStorage:', e);
                            }

                            // Сохраняем фото в gist через GitHub API
                            if (utilisateurActuel.syncGithubActive && utilisateurActuel.tokenGithub) {
                                sauvegarderPhotoProfilDansGist(utilisateurActuel.nomUtilisateur, ev.target.result, utilisateurActuel.tokenGithub);
                            }
                        }
                    };
                    reader.readAsDataURL(file);
                }
            });
        }
    }, 1000); // Задержка 1 секунда для полной загрузки
});