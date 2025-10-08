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
let utilisateurAffiche = null; // user whose statistics are currently displayed (can be a friend)

// Simple embedded SVG placeholder to avoid external file dependency
const DATA_URI_PLACEHOLDER = 'default.jpeg';

// localStorage key helpers for lastRead per user (map of conversation -> ISO timestamp)
function getLastReadKey(username) { return `lastRead:${String(username || '')}`; }
function loadLastRead(username) {
        try { const raw = localStorage.getItem(getLastReadKey(username)); return raw ? JSON.parse(raw) : {}; } catch (e) { return {}; }
}
function saveLastRead(username, obj) { try { localStorage.setItem(getLastReadKey(username), JSON.stringify(obj)); } catch(e){} }

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
    // Initialiser les utilisateurs globaux
    // Initialize global users with Admin user having zeroed stats
    utilisateursGlobaux = [
        { nomUtilisateur: "Admin", points: 0, ligue: "Bronze", etudes: "", tempsEtudeTotale: 0, tempsPrevu: 0 },
    ];

    // Initialize a default Admin user (with zeroed statistics)
    utilisateurs.set('Admin', {
        nomUtilisateur: 'Admin',
        motDePasse: 'adminhuy',
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
        parametres: {
            sonActive: true,
            minuteurPersonnalise: { tempsTravail: 25, pauseCourte: 5, pauseLongue: 15, cycles: 4 }
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
        // Ensure global list has the user for leaderboard sync
        let globalEntry = utilisateursGlobaux.find(u => u.nomUtilisateur === utilisateurActuel.nomUtilisateur);
        if (!globalEntry) {
            utilisateursGlobaux.push({ nomUtilisateur: utilisateurActuel.nomUtilisateur, points: utilisateurActuel.pointsTotaux || 0, ligue: utilisateurActuel.niveau? obtenirLigueUtilisateur(utilisateurActuel.pointsTotaux || 0) : 'Bronze', etudes: utilisateurActuel.etudes || '', tempsEtudeTotale: utilisateurActuel.tempsEtudeTotale || 0, tempsPrevu: utilisateurActuel.tempsPrevu || 0 });
        } else {
            globalEntry.points = utilisateurActuel.pointsTotaux || 0;
            globalEntry.tempsEtudeTotale = utilisateurActuel.tempsEtudeTotale || 0;
            globalEntry.tempsPrevu = utilisateurActuel.tempsPrevu || 0;
        }
        // default displayed user is current user
        utilisateurAffiche = utilisateurActuel;
        mettreAJourInterfaceUtilisateur();
    // Update top-left bar
    mettreAJourTopBar();
        afficherNotification('Bienvenue, ' + nomUtilisateur + '!', 'success');
    } else {
        afficherNotification('Nom d\'utilisateur ou mot de passe incorrect', 'error');
    }
}

function gererInscription() {
    const nomUtilisateur = document.getElementById('username').value;
    const motDePasse = document.getElementById('password').value;

    if (!nomUtilisateur ||!motDePasse) {
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
        parametres: {
            sonActive: true,
            minuteurPersonnalise: { tempsTravail: 45, pauseCourte: 10, pauseLongue: 20, cycles: 3 }
        }
    };

    utilisateurs.set(nomUtilisateur, nouvelUtilisateur);
    // Add to global list and keep time fields for leaderboard synchronization
    utilisateursGlobaux.push({ nomUtilisateur: nomUtilisateur, points: 0, ligue: "Bronze", etudes: "", tempsEtudeTotale: 0, tempsPrevu: 0 });
    utilisateurActuel = nouvelUtilisateur;
    afficherEcran('main-screen');
    mettreAJourInterfaceUtilisateur();
    utilisateurAffiche = utilisateurActuel;
    // Update top-left bar for new user
    mettreAJourTopBar();
    // ensure UI shows zeros explicitly
    afficherStatsUtilisateur(utilisateurActuel);
    afficherNotification('Compte créé avec succès!', 'success');
}

function gererDeconnexion() {
    utilisateurActuel = null;
    arreterMinuteur();
    afficherEcran('login-screen');
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
    // reset top bar
    mettreAJourTopBar();
}

// Fonctions de navigation
function afficherEcran(idEcran) {
    const ecrans = document.querySelectorAll('.screen');
    ecrans.forEach(ecran => ecran.classList.remove('active'));
    document.getElementById(idEcran).classList.add('active');
    // If main screen shown, refresh top bar to display current user
    if (idEcran === 'main-screen') {
        mettreAJourTopBar();
    }
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

// Fonctions du minuteur avec nouvelle logique de skip
function demarrerMinuteur() {
    if (!minuteurEnCours) {
        minuteurEnCours = true;
        tempsDebut = Date.now(); // Marquer le temps de début
        console.debug('demarrerMinuteur: tempsDebut=', tempsDebut);
        mettreAJourControlesMinuteur();
        
        intervalleMinuteur = setInterval(() => {
            tempsRestant--;
            mettreAJourAffichageMinuteur();
            // update visible time and progress
            const elTimeDisplay = document.getElementById('time-display');
            if (elTimeDisplay) {
                const mins = Math.floor(tempsRestant / 60);
                const secs = Math.max(0, tempsRestant % 60);
                elTimeDisplay.textContent = String(mins).padStart(2,'0') + ':' + String(secs).padStart(2,'0');
            }
            try { mettreAJourBarreProgres(); } catch(e) {}
            
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
        console.debug('pauserMinuteur: paused at tempsDebut=', tempsDebut);
        mettreAJourControlesMinuteur();
    }
}

function arreterMinuteur() {
    // If a work session was started and is stopped manually, record the elapsed time as interrupted
    if (phaseActuelle === 'work' && tempsDebut && tempsDebut > 0) {
        const secondesEcoulees = Math.max(0, Math.floor((Date.now() - tempsDebut) / 1000));
        // Count full minutes only (0 if <60s)
        const minutesEcoulees = Math.floor(secondesEcoulees / 60);
        console.debug('arreterMinuteur: secs=', secondesEcoulees, 'mins=', minutesEcoulees);
        if (minutesEcoulees > 0) {
            ajouterSessionEtudeInterrompue(minutesEcoulees);
            const msg = messagesInterface.sessionInterrompue.replace('{temps}', minutesEcoulees);
            afficherNotification(msg, 'info');
            verifierSucces();
        }
    }
    minuteurEnCours = false;
    clearInterval(intervalleMinuteur);
    reinitialiserMinuteur();
    // ensure tempsDebut reset
    tempsDebut = 0;
    mettreAJourControlesMinuteur();
    mettreAJourAffichageMinuteur();
    mettreAJourBarreProgres();
}

function passerMinuteur() {
    // compute real elapsed seconds since start
    const secondesEcoulees = Math.max(0, Math.floor((Date.now() - (tempsDebut || Date.now())) / 1000));
    if (phaseActuelle === 'work') {
        const tempsEcouleMin = Math.floor(secondesEcoulees / 60);
        if (tempsEcouleMin > 0) {
            ajouterSessionEtudeInterrompue(tempsEcouleMin);
            const message = messagesInterface.sessionInterrompue.replace('{temps}', tempsEcouleMin);
            afficherNotification(message, 'info');
            verifierSucces();
        }
    }
    clearInterval(intervalleMinuteur);
    minuteurEnCours = false;
    passerAPhasesuivante();
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
    const elTimerSession = document.getElementById('timer-session');
    if (elTimerSession) elTimerSession.textContent = 'Travail';
}

function minuteurTermine() {
    clearInterval(intervalleMinuteur);
    minuteurEnCours = false;
    
    jouerSon('complete');
    
    if (phaseActuelle === 'work') {
        // Calculate real elapsed minutes from tempsDebut if available
        const secondesEcoulees = Math.max(0, Math.floor((Date.now() - (tempsDebut || Date.now())) / 1000));
        let tempsSession = Math.floor(secondesEcoulees / 60);
        if (tempsSession <= 0) {
            tempsSession = Math.floor(tempsTotal / 60);
        }
        console.debug('minuteurTermine: secondesEcoulees=', secondesEcoulees, 'tempsSession=', tempsSession);
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
    tempsDebut = 0;
}

// Update the progress fill and time display safely
function mettreAJourBarreProgres() {
    const progress = document.getElementById('progress-fill');
    const timeDisplay = document.getElementById('time-display');
    // Avoid division by zero
    const total = Math.max(1, tempsTotal);
    const remaining = Math.max(0, tempsRestant);
    const percent = Math.max(0, Math.min(100, Math.round(((total - remaining) / total) * 100)));
    if (progress) {
        progress.style.width = percent + '%';
    }
    if (timeDisplay) {
        const mins = Math.floor(remaining / 60);
        const secs = Math.max(0, remaining % 60);
        timeDisplay.textContent = String(mins).padStart(2,'0') + ':' + String(secs).padStart(2,'0');
    }
}

function passerAPhasesuivante() {
    const config = typesMinuteurs[typeMinuteurActuel];
    
    if (phaseActuelle === 'work') {
        if (cycleActuel >= config.cycles) {
            phaseActuelle = 'longBreak';
            tempsRestant = config.pauseLongue * 60;
            tempsTotal = config.pauseLongue * 60;
            const elTimerSession = document.getElementById('timer-session');
            if (elTimerSession) elTimerSession.textContent = 'Pause Longue';
            cycleActuel = 1;
        } else {
            phaseActuelle = 'shortBreak';
            tempsRestant = config.pauseCourte * 60;
            tempsTotal = config.pauseCourte * 60;
            const elTimerSession2 = document.getElementById('timer-session');
            if (elTimerSession2) elTimerSession2.textContent = 'Pause Courte';
        }
        afficherNotification(messagesInterface.pauseRecommandee, 'info');
    } else {
        phaseActuelle = 'work';
        tempsRestant = config.tempsTravail * 60;
        tempsTotal = config.tempsTravail * 60;
        const elTimerSession3 = document.getElementById('timer-session');
        if (elTimerSession3) elTimerSession3.textContent = 'Travail';
        if (phaseActuelle!== 'longBreak') {
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
    const elType = document.getElementById('current-timer-type');
    if (elType) elType.textContent = nomsTypes[typeMinuteurActuel];
}

// Safe update of timer control buttons (start/pause/stop/skip)
function mettreAJourControlesMinuteur() {
    const btnStart = document.getElementById('start-btn');
    const btnPause = document.getElementById('pause-btn');
    const btnStop = document.getElementById('stop-btn');
    const btnSkip = document.getElementById('skip-btn');

    // If elements are missing (different screens), just skip
    if (btnStart) {
        btnStart.disabled = !!minuteurEnCours;
        btnStart.textContent = minuteurEnCours ? 'En cours' : 'Démarrer';
    }
    if (btnPause) {
        btnPause.disabled = !minuteurEnCours;
        btnPause.textContent = minuteurEnCours ? 'Pause' : 'Reprendre';
    }
    if (btnStop) {
        // stop is enabled when a session was started (tempsDebut set) or the timer is running
        btnStop.disabled = !minuteurEnCours && !tempsDebut;
        if (!btnStop.disabled) btnStop.textContent = 'Arrêter';
    }
    if (btnSkip) {
        // skip can be available even when not running (to move phases)
        btnSkip.disabled = false;
        if (btnSkip) btnSkip.textContent = 'Passer';
    }
}

function mettreAJourAffichageMinuteur() {
    if (!utilisateurActuel) return;

    // Defensive DOM writes: get elements and set only if present
    const elCurrentUsername = document.getElementById('current-username');
    const elUserLevel = document.getElementById('user-level');
    const elUserPoints = document.getElementById('user-points');
    const elCurrentStreak = document.getElementById('current-streak');
    const elSessionsCompletes = document.getElementById('sessions-completes');
    const elCompletionRate = document.getElementById('completion-rate');

    if (elCurrentUsername) elCurrentUsername.textContent = utilisateurActuel.nomUtilisateur;
    if (elUserLevel) elUserLevel.textContent = utilisateurActuel.niveau;
    if (elUserPoints) elUserPoints.textContent = utilisateurActuel.pointsTotaux;
    if (elCurrentStreak) elCurrentStreak.textContent = utilisateurActuel.serieActuelle;
    if (elSessionsCompletes) elSessionsCompletes.textContent = utilisateurActuel.sessionsCompletees;
    if (elCompletionRate) elCompletionRate.textContent = utilisateurActuel.tauxCompletion;

    const aujourdhui = new Date().toDateString();
    const minutesAujourdhui = utilisateurActuel.statistiquesQuotidiennes[aujourdhui] || 0;
    const elTodayTime = document.getElementById('today-time');
    if (elTodayTime) elTodayTime.textContent = minutesAujourdhui;

    // Mettre à jour les nouvelles statistiques (guarded)
    const completeSessionsEl = document.getElementById('complete-sessions');
    const interruptedSessionsEl = document.getElementById('interrupted-sessions');
    const realTimeEl = document.getElementById('real-time');
    const plannedTimeEl = document.getElementById('planned-time');
    const completeSessionsElAlt = document.getElementById('sessions-completed');
    const completeSessionsElAlt2 = document.getElementById('sessions-completes');
    const interruptedSessionsElAlt = document.getElementById('interrupted-sessions');

    if (completeSessionsEl) completeSessionsEl.textContent = utilisateurActuel.sessionsCompletees;
    if (completeSessionsElAlt) completeSessionsElAlt.textContent = utilisateurActuel.sessionsCompletees;
    if (completeSessionsElAlt2) completeSessionsElAlt2.textContent = utilisateurActuel.sessionsCompletees;
    if (interruptedSessionsEl) interruptedSessionsEl.textContent = utilisateurActuel.sessionsInterrompues;
    if (interruptedSessionsElAlt) interruptedSessionsElAlt.textContent = utilisateurActuel.sessionsInterrompues;
    if (realTimeEl) realTimeEl.textContent = utilisateurActuel.tempsEtudeTotale;
    if (plannedTimeEl) plannedTimeEl.textContent = utilisateurActuel.tempsPrevu;

    rendreSuccesRecents();
    // Update statistics panel to reflect currently displayed user
    afficherStatsUtilisateur(utilisateurAffiche || utilisateurActuel);
    // Update top-left total time and pink username
    const topTotal = document.getElementById('top-total-time');
    const topPink = document.getElementById('top-username-pink');
    if (topTotal) topTotal.textContent = (utilisateurActuel.tempsEtudeTotale || 0) + ' min';
    if (topPink) topPink.textContent = utilisateurActuel.nomUtilisateur;
    
    calculerTauxCompletion();
    mettreAJourInterfaceUtilisateur();
    // ensure top bar and global list reflect the change
    mettreAJourTopBar();
    // direct DOM updates to be defensive
    try { document.getElementById('today-time').textContent = utilisateurActuel.statistiquesQuotidiennes[new Date().toDateString()] || 0; } catch(e){}
    try { document.getElementById('top-total-time').textContent = (utilisateurActuel.tempsEtudeTotale || 0) + ' min'; } catch(e){}
}

function ajouterSessionEtudeInterrompue(minutes) {
    if (!utilisateurActuel) return;
    utilisateurActuel.tempsEtudeTotale += minutes;
    // Не добавляем tempsPrevu при прерывании сессии
    utilisateurActuel.sessionsInterrompues++;

    const aujourdhui = new Date().toDateString();
    if (!utilisateurActuel.statistiquesQuotidiennes[aujourdhui]) {
        utilisateurActuel.statistiquesQuotidiennes[aujourdhui] = 0;
    }
    utilisateurActuel.statistiquesQuotidiennes[aujourdhui] += minutes;

    const points = minutes * 1;
    ajouterPoints(points);
    calculerTauxCompletion();
    mettreAJourInterfaceUtilisateur();
    // update top bar
    mettreAJourTopBar();
    // direct DOM updates to be defensive
    try { document.getElementById('today-time').textContent = utilisateurActuel.statistiquesQuotidiennes[new Date().toDateString()] || 0; } catch(e){}
    try { document.getElementById('top-total-time').textContent = (utilisateurActuel.tempsEtudeTotale || 0) + ' min'; } catch(e){}
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
        // Keep time fields synchronized as well
        utilisateurGlobal.tempsEtudeTotale = utilisateurActuel.tempsEtudeTotale;
        utilisateurGlobal.tempsPrevu = utilisateurActuel.tempsPrevu;
    }
    
    const nouveauNiveau = Math.floor(utilisateurActuel.pointsTotaux / 100) + 1;
    if (nouveauNiveau > utilisateurActuel.niveau) {
        utilisateurActuel.niveau = nouveauNiveau;
        afficherNotification(`Félicitations! Vous avez atteint le niveau ${nouveauNiveau}!`, 'success');
    }
    // update UI including top bar after points change
    mettreAJourInterfaceUtilisateur();
    mettreAJourTopBar();
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
    // Defensive updates for many possible DOM IDs (some screens don't include all elements)
    const elCurrentUsername = document.getElementById('current-username');
    const elUserLevel = document.getElementById('user-level');
    const elUserPoints = document.getElementById('user-points');
    const elCurrentStreak = document.getElementById('current-streak');
    const elSessionsCompletes = document.getElementById('sessions-completes');
    const elCompletionRate = document.getElementById('completion-rate');

    if (elCurrentUsername) elCurrentUsername.textContent = utilisateurActuel.nomUtilisateur;
    if (elUserLevel) elUserLevel.textContent = utilisateurActuel.niveau;
    if (elUserPoints) elUserPoints.textContent = utilisateurActuel.pointsTotaux;
    if (elCurrentStreak) elCurrentStreak.textContent = utilisateurActuel.serieActuelle;
    if (elSessionsCompletes) elSessionsCompletes.textContent = utilisateurActuel.sessionsCompletees;
    if (elCompletionRate) elCompletionRate.textContent = utilisateurActuel.tauxCompletion;

    const aujourdhui = new Date().toDateString();
    const minutesAujourdhui = utilisateurActuel.statistiquesQuotidiennes ? (utilisateurActuel.statistiquesQuotidiennes[aujourdhui] || 0) : 0;
    const elTodayTime = document.getElementById('today-time');
    if (elTodayTime) elTodayTime.textContent = minutesAujourdhui;

    // Mettre à jour les nouvelles statistiques (guarded)
    const completeSessionsEl = document.getElementById('complete-sessions');
    const interruptedSessionsEl = document.getElementById('interrupted-sessions');
    const realTimeEl = document.getElementById('real-time');
    const plannedTimeEl = document.getElementById('planned-time');
    const completeSessionsElAlt = document.getElementById('sessions-completed');
    const completeSessionsElAlt2 = document.getElementById('sessions-completes');
    const interruptedSessionsElAlt = document.getElementById('interrupted-sessions');

    if (completeSessionsEl) completeSessionsEl.textContent = utilisateurActuel.sessionsCompletees;
    if (completeSessionsElAlt) completeSessionsElAlt.textContent = utilisateurActuel.sessionsCompletees;
    if (completeSessionsElAlt2) completeSessionsElAlt2.textContent = utilisateurActuel.sessionsCompletees;
    if (interruptedSessionsEl) interruptedSessionsEl.textContent = utilisateurActuel.sessionsInterrompues;
    if (interruptedSessionsElAlt) interruptedSessionsElAlt.textContent = utilisateurActuel.sessionsInterrompues;
    if (realTimeEl) realTimeEl.textContent = utilisateurActuel.tempsEtudeTotale;
    if (plannedTimeEl) plannedTimeEl.textContent = utilisateurActuel.tempsPrevu;

    rendreSuccesRecents();
    afficherStatsUtilisateur(utilisateurAffiche || utilisateurActuel);

    const topTotal = document.getElementById('top-total-time');
    const topPink = document.getElementById('top-username-pink');
    if (topTotal) topTotal.textContent = (utilisateurActuel.tempsEtudeTotale || 0) + ' min';
    if (topPink) topPink.textContent = utilisateurActuel.nomUtilisateur;

    // refresh friends list badges if friends panel exists
    try { rendreAmis(); } catch(e) {}
}

function rendreSuccesRecents() {
    const conteneur = document.getElementById('recent-achievements');
    if (!conteneur) return;
    
    conteneur.innerHTML = '';
    
    const succesDesbloques = succes.filter(s => 
        utilisateurActuel.succes.includes(s.id)
    ).slice(-3);
    
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
    // Render statistics for the user currently displayed (utilisateurAffiche) or the current user
    if (!utilisateurAffiche) utilisateurAffiche = utilisateurActuel;
    rendreGraphiqueEfficaciteHebdomadaire();
    rendreGraphiqueCompletion();
    rendreGraphiqueCategories();
    rendreGraphiqueCorrelation();
    // Update stats header info
    const statsPhoto = document.getElementById('stats-owner-photo');
    const statsName = document.getElementById('stats-owner-name');
    const statsMeta = document.getElementById('stats-owner-meta');
    if (utilisateurAffiche) {
        if (statsPhoto) statsPhoto.src = utilisateurAffiche.photo || (utilisateurs.get(utilisateurAffiche.nomUtilisateur) && utilisateurs.get(utilisateurAffiche.nomUtilisateur).photo) || DATA_URI_PLACEHOLDER;
        if (statsName) statsName.textContent = utilisateurAffiche.nomUtilisateur;
        if (statsMeta) statsMeta.textContent = utilisateurAffiche === utilisateurActuel ? 'Sélection: vous' : 'Sélection: ami';
        // Summary metrics
        const summaryTotal = document.getElementById('summary-total');
        const summaryAvg = document.getElementById('summary-avg');
        const summaryStreak = document.getElementById('summary-streak');
        const summaryEff = document.getElementById('summary-eff');
        if (summaryTotal) summaryTotal.textContent = utilisateurAffiche.tempsEtudeTotale || 0;
        if (summaryAvg) summaryAvg.textContent = Math.round(((utilisateurAffiche.tempsEtudeTotale || 0) / 7));
        if (summaryStreak) summaryStreak.textContent = utilisateurAffiche.serieActuelle || 0;
        if (summaryEff) summaryEff.textContent = (utilisateurAffiche.tauxCompletion || 0) + '%';
    }
}

function afficherStatsUtilisateur(user) {
    // Fill the stats summary area (complete/interrupted/real/planned) for the selected user
    const completeEl = document.getElementById('complete-sessions');
    const interruptedEl = document.getElementById('interrupted-sessions');
    const realEl = document.getElementById('real-time');
    const plannedEl = document.getElementById('planned-time');

    if (!user) {
        if (completeEl) completeEl.textContent = '0';
        if (interruptedEl) interruptedEl.textContent = '0';
        if (realEl) realEl.textContent = '0';
        if (plannedEl) plannedEl.textContent = '0';
        return;
    }

    if (completeEl) completeEl.textContent = user.sessionsCompletees || 0;
    if (interruptedEl) interruptedEl.textContent = user.sessionsInterrompues || 0;
    if (realEl) realEl.textContent = user.tempsEtudeTotale || 0;
    if (plannedEl) plannedEl.textContent = user.tempsPrevu || 0;
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
        donneesHebdomadaires.push((utilisateurAffiche && utilisateurAffiche.statistiquesQuotidiennes && utilisateurAffiche.statistiquesQuotidiennes[dateStr]) || 0);
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
                    labels: { color: '#ffffff', font: { size: 10 } }
                }
            },
            scales: {
                y: {
                    ticks: { color: '#cccccc', font: { size: 10 } },
                    grid: { color: '#444444' }
                },
                x: {
                    ticks: { color: '#cccccc', font: { size: 10 } },
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
    
    const sessionsCompletes = (utilisateurAffiche && utilisateurAffiche.sessionsCompletees) || 0;
    const sessionsInterrompues = (utilisateurAffiche && utilisateurAffiche.sessionsInterrompues) || 0;
    
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
                    labels: { color: '#ffffff', font: { size: 10 } }
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
                    labels: { color: '#ffffff', font: { size: 10 } }
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
                    labels: { color: '#ffffff', font: { size: 10 } }
                }
            },
            scales: {
                y: {
                    ticks: { color: '#cccccc', font: { size: 10 } },
                    grid: { color: '#444444' }
                },
                x: {
                    ticks: { color: '#cccccc', font: { size: 10 } },
                    grid: { color: '#444444' }
                }
            }
        }
    });
}

// Fonctions des tournois
function rendreTournois() {
    document.getElementById('weekly-t-name').textContent = tournois.tournoiHebdomadaire.nom;
    // Render participants and simple ranking by study time
    const participants = utilisateursGlobaux.filter(u => u.participeTournoi);
    if (participants.length === 0) {
        document.getElementById('bracket-container').innerHTML = '<p>Les participants seront affichés après inscription</p>';
        return;
    }
    // Sort by tempsEtudeTotale desc
    participants.sort((a, b) => (b.tempsEtudeTotale || 0) - (a.tempsEtudeTotale || 0));
    const html = participants.map((p, i) => `<div style="padding:8px;border-bottom:1px solid var(--y2k-border);display:flex;align-items:center;gap:8px;"><span style="width:28px;text-align:center;">${i+1}</span><span style="width:36px;height:36px;overflow:hidden;border-radius:6px;"><img src="${p.photo || DATA_URI_PLACEHOLDER}" style="width:100%;height:100%;object-fit:cover;"/></span><strong>${p.nomUtilisateur}</strong><span style="margin-left:auto;color:var(--y2k-text-secondary);">${p.tempsEtudeTotale || 0} min</span></div>`).join('');
    document.getElementById('bracket-container').innerHTML = html;
}

function inscrirePourTournoi() {
    if (!utilisateurActuel) { afficherNotification('Connectez-vous d\'abord', 'error'); return; }
    // mark in global list
    let globalEntry = utilisateursGlobaux.find(u => u.nomUtilisateur === utilisateurActuel.nomUtilisateur);
    if (!globalEntry) {
        globalEntry = { nomUtilisateur: utilisateurActuel.nomUtilisateur, points: utilisateurActuel.pointsTotaux || 0, ligue: obtenirLigueUtilisateur(utilisateurActuel.pointsTotaux || 0), etudes: utilisateurActuel.etudes || '', tempsEtudeTotale: utilisateurActuel.tempsEtudeTotale || 0 };
        utilisateursGlobaux.push(globalEntry);
    }
    globalEntry.participeTournoi = true;
    afficherNotification('Vous êtes inscrit au tournoi!', 'success');
    document.getElementById('register-weekly').textContent = 'Inscrit';
    document.getElementById('register-weekly').disabled = true;
    // re-render
    rendreTournois();
}

// Fonctions des classements
function rendreClassements() {
    const tbody = document.querySelector('#global-leaderboard tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    // Tri par temps d'étude réel (tempsEtudeTotale)
    const utilisateursTries = [...utilisateursGlobaux].sort((a, b) => (b.tempsEtudeTotale || 0) - (a.tempsEtudeTotale || 0));

    utilisateursTries.forEach((utilisateur, index) => {
        const rangee = document.createElement('tr');
        // Use avatar if available (utilisateur.photo) otherwise look for photo in users map
    const photoSrc = utilisateur.photo || (utilisateurs.get(utilisateur.nomUtilisateur) && utilisateurs.get(utilisateur.nomUtilisateur).photo) || DATA_URI_PLACEHOLDER;
        rangee.innerHTML = `
            <td>${index + 1}</td>
            <td><span class="leaderboard-avatar"><img src="${photoSrc}" alt="avatar"></span></td>
            <td>${utilisateur.nomUtilisateur}</td>
            <td>${utilisateur.tempsEtudeTotale || 0} min</td>
            <td>${utilisateur.ligue}</td>
            <td>${utilisateur.etudes}</td>
        `;
        tbody.appendChild(rangee);
    });
}

// Fonctions des amis
function rendreAmis() {
    const listeAmis = document.getElementById('friends-list');
    const serieGroupe = document.getElementById('group-streak');
    
    if (!utilisateurActuel ||!listeAmis) return;
    
    listeAmis.innerHTML = '<h4>Mes amis :</h4>';
    
    if (utilisateurActuel.amis.length === 0) {
        listeAmis.innerHTML += '<p>Vous n\'avez pas encore d\'amis. Ajoutez des amis pour étudier ensemble!</p>';
    } else {
        utilisateurActuel.amis.forEach(nomAmi => {
            const divAmi = document.createElement('div');
            divAmi.className = 'friend-item';
            divAmi.style.cssText = 'padding: 8px; margin: 4px 0; background: var(--y2k-surface-light); border-radius: 4px; font-size: 10px;';
            // Find friend in global users to get avatar
            const friendGlobal = utilisateursGlobaux.find(u => u.nomUtilisateur === nomAmi) || {};
            const friendPhoto = friendGlobal.photo || (utilisateurs.get(nomAmi) && utilisateurs.get(nomAmi).photo) || DATA_URI_PLACEHOLDER;
            // Determine online state (use friendGlobal.online if available, otherwise default to false)
            const isOnline = friendGlobal.online === undefined ? false : !!friendGlobal.online;
            // compute unread count for this friend for current user
            const lastRead = loadLastRead(utilisateurActuel ? utilisateurActuel.nomUtilisateur : null) || {};
            const convo = loadConversation(utilisateurActuel ? utilisateurActuel.nomUtilisateur : null, nomAmi) || [];
            const unreadCount = convo.filter(m => m.sender === nomAmi && (!lastRead[getConversationKey(m.sender, m.receiver)] || new Date(m.time) > new Date(lastRead[getConversationKey(m.sender, m.receiver)]))).length;
            divAmi.innerHTML = `
                <span class="friend-avatar"><img src="${friendPhoto}" alt="avatar"></span>
                <span class="friend-name ${isOnline ? 'online' : 'offline'}">${nomAmi}</span>
                <div style="margin-left:auto;display:flex;gap:6px;align-items:center;">
                    <button class="view-stats-btn pixel-btn secondary-btn" data-user="${nomAmi}">Voir stats</button>
                    <button class="msg-btn pixel-btn">Message</button>
                    ${unreadCount > 0 ? `<span class="friend-unread-badge">${unreadCount}</span>` : ''}
                </div>
            `;
            // clicking a friend will display their statistics
            // clicking name area shows stats as before
            divAmi.addEventListener('click', (e) => {
                if (e.target && e.target.classList && (e.target.classList.contains('msg-btn') || e.target.classList.contains('view-stats-btn'))) return;
                const userObj = utilisateurs.get(nomAmi) || utilisateursGlobaux.find(u => u.nomUtilisateur === nomAmi);
                if (userObj) {
                    utilisateurAffiche = userObj;
                    afficherStatsUtilisateur(utilisateurAffiche);
                    rendreStatistiquesAvancees();
                    const statsBtn = document.querySelector('[data-tab="statistics"]');
                    if (statsBtn) statsBtn.click();
                }
            });
            // Attach message button handler
            listeAmis.appendChild(divAmi);
            const msgBtn = divAmi.querySelector('.msg-btn');
            if (msgBtn) {
                msgBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    ouvrirChatAvec(nomAmi);
                });
            }
            const viewStatsBtn = divAmi.querySelector('.view-stats-btn');
            if (viewStatsBtn) {
                viewStatsBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const userObj = utilisateurs.get(nomAmi) || utilisateursGlobaux.find(u => u.nomUtilisateur === nomAmi);
                    if (userObj) {
                        utilisateurAffiche = userObj;
                        afficherStatsUtilisateur(utilisateurAffiche);
                        rendreStatistiquesAvancees();
                        const statsBtn = document.querySelector('[data-tab="statistics"]');
                        if (statsBtn) statsBtn.click();
                    }
                });
            }
        });
    }
    
    if (serieGroupe) {
        // Compute a real group streak: the minimum consecutive days among the user and their friends
        if (!utilisateurActuel.amis || utilisateurActuel.amis.length === 0) {
            serieGroupe.innerHTML = '<p>Aucun groupe pour l\'instant — ajoutez des amis pour commencer une série de groupe.</p>';
        } else {
            const series = [];
            // include current user
            series.push(Number(utilisateurActuel.serieActuelle) || 0);
            utilisateurActuel.amis.forEach(nomAmi => {
                const u = utilisateurs.get(nomAmi) || utilisateursGlobaux.find(x => x.nomUtilisateur === nomAmi) || {};
                series.push(Number(u.serieActuelle) || 0);
            });
            const groupStreak = Math.min(...series);
            if (groupStreak > 0) {
                serieGroupe.innerHTML = `<h4>Série de groupe : ${groupStreak} jour${groupStreak>1? 's':''}</h4><p>Votre groupe étudie ensemble depuis ${groupStreak} jours consécutifs.</p>`;
            } else {
                serieGroupe.innerHTML = '<p>Pas encore de série de groupe active. Étudiez quelques jours avec vos amis pour déclencher une série.</p>';
            }
        }
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
    // For demo, mark friend as offline by default (unless they exist with state)
    let friendGlobal = utilisateursGlobaux.find(u => u.nomUtilisateur === nomUtilisateurAmi);
    if (!friendGlobal) {
        utilisateursGlobaux.push({ nomUtilisateur: nomUtilisateurAmi, points: 0, ligue: 'Bronze', etudes: '', tempsEtudeTotale: 0, online: false });
    }
}

// Chat functions
function ouvrirChatAvec(nomAmi) {
    const panel = document.getElementById('chat-panel');
    const chatWith = document.getElementById('chat-with');
    const messages = document.getElementById('chat-messages');
    if (!panel || !chatWith || !messages) return;

    if (!utilisateurActuel) {
        afficherNotification('Connectez-vous pour envoyer des messages', 'error');
        return;
    }

    chatWith.textContent = `Message: ${nomAmi}`;
    panel.classList.remove('hidden');

    // Close handler
    document.getElementById('close-chat').onclick = () => panel.classList.add('hidden');

    // Load conversation from localStorage (shared between both users)
    const convo = loadConversation(utilisateurActuel.nomUtilisateur, nomAmi);
    renderConversation(convo, messages);

    // After rendering, mark conversation as read for current user
    const lastReadObj = loadLastRead(utilisateurActuel.nomUtilisateur) || {};
    lastReadObj[getConversationKey(utilisateurActuel.nomUtilisateur, nomAmi)] = new Date().toISOString();
    saveLastRead(utilisateurActuel.nomUtilisateur, lastReadObj);
    // re-render friends list to hide badge
    rendreAmis();

    // Ensure send handler is attached (replace previous handler)
    const send = document.getElementById('chat-send');
    send.onclick = () => {
        const input = document.getElementById('chat-input');
        const text = input.value.trim();
        if (!text) return;

        const message = {
            sender: utilisateurActuel.nomUtilisateur,
            receiver: nomAmi,
            text: text,
            time: new Date().toISOString()
        };

        convo.push(message);
        saveConversation(utilisateurActuel.nomUtilisateur, nomAmi, convo);
        renderConversation(convo, messages);
        input.value = '';
        messages.scrollTop = messages.scrollHeight;
        // mark as read for sender (since they see it)
        const lastReadObj2 = loadLastRead(utilisateurActuel.nomUtilisateur) || {};
        lastReadObj2[getConversationKey(utilisateurActuel.nomUtilisateur, nomAmi)] = new Date().toISOString();
        saveLastRead(utilisateurActuel.nomUtilisateur, lastReadObj2);
        // update friends badges
        rendreAmis();
    };
}

// Conversation storage helpers (localStorage)
function getConversationKey(a, b) {
    const ids = [String(a || ''), String(b || '')].map(s => s.toLowerCase()).sort();
    return `chat:${ids[0]}:${ids[1]}`;
}

function loadConversation(a, b) {
    try {
        const key = getConversationKey(a, b);
        const raw = localStorage.getItem(key);
        if (!raw) return [];
        return JSON.parse(raw);
    } catch (e) {
        console.error('Erreur loadConversation', e);
        return [];
    }
}

function saveConversation(a, b, messages) {
    try {
        const key = getConversationKey(a, b);
        localStorage.setItem(key, JSON.stringify(messages));
    } catch (e) {
        console.error('Erreur saveConversation', e);
    }
}

function renderConversation(messagesArray, container) {
    container.innerHTML = '';
    if (!messagesArray || messagesArray.length === 0) {
        const p = document.createElement('div');
        p.className = 'chat-empty';
        p.textContent = 'Aucun message — commencez la conversation.';
        container.appendChild(p);
        return;
    }

    messagesArray.forEach(m => {
        const row = document.createElement('div');
        row.className = 'chat-message-row';

        const img = document.createElement('img');
        img.src = getUserPhoto(m.sender) || DATA_URI_PLACEHOLDER;
        img.alt = m.sender;
        img.style.width = '36px';
        img.style.height = '36px';
        img.style.objectFit = 'cover';
        img.style.borderRadius = '6px';

        const bubble = document.createElement('div');
        const time = new Date(m.time).toLocaleString();
        const isMe = m.sender === utilisateurActuel.nomUtilisateur;
        bubble.className = 'chat-bubble ' + (isMe ? 'me' : 'other');
        bubble.innerHTML = `<div style="font-weight:600">${isMe? 'Vous' : escapeHtml(m.sender)} <span class='chat-meta'>${time}</span></div><div>${escapeHtml(m.text)}</div>`;

        if (isMe) {
            // append bubble then avatar (right aligned)
            row.appendChild(bubble);
            row.appendChild(img);
        } else {
            row.appendChild(img);
            row.appendChild(bubble);
        }

        container.appendChild(row);
    });


function getUserPhoto(nom) {
    if (!nom) return DATA_URI_PLACEHOLDER;
    const global = utilisateursGlobaux.find(u => u.nomUtilisateur === nom);
    if (global && global.photo) return global.photo;
    const local = utilisateurs.get(nom);
    if (local && local.photo) return local.photo;
    return DATA_URI_PLACEHOLDER;
}

function escapeHtml(unsafe) {
    return String(unsafe).replace(/[&<"'>]/g, function(m) { return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'})[m]; });
}
    // (rendering done above)
}

// Ensure top-left display is always updated from the active user
function mettreAJourTopBar() {
    const topTotal = document.getElementById('top-total-time');
    const topPink = document.getElementById('top-username-pink');
    const topPhoto = document.getElementById('top-user-photo');
    const rankEl = document.getElementById('user-rank');

    if (!utilisateurActuel) {
        if (topTotal) topTotal.textContent = '0 min';
        if (topPink) topPink.textContent = '—';
        if (topPhoto) topPhoto.src = DATA_URI_PLACEHOLDER;
        if (rankEl) rankEl.textContent = '—';
        return;
    }

    if (topTotal) topTotal.textContent = (utilisateurActuel.tempsEtudeTotale || 0) + ' min';
    if (topPink) topPink.textContent = utilisateurActuel.nomUtilisateur;
    if (topPhoto) topPhoto.src = utilisateurActuel.photo || DATA_URI_PLACEHOLDER;

    // Compute rank by sorting global users by study time
    if (rankEl && utilisateursGlobaux && utilisateursGlobaux.length > 0) {
        const sorted = [...utilisateursGlobaux].sort((a, b) => (b.tempsEtudeTotale || 0) - (a.tempsEtudeTotale || 0));
        const idx = sorted.findIndex(u => u.nomUtilisateur === utilisateurActuel.nomUtilisateur);
        rankEl.textContent = idx >= 0 ? (idx + 1) : '—';
    }
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
                divStatut.innerHTML = '<p style="color: var(--y2k-primary);">✅ Synchronisation active</p>';
            } else {
                divStatut.innerHTML = '<p style="color: var(--y2k-text-secondary);">❌ Synchronisation non configurée</p>';
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
        document.getElementById('github-status').innerHTML = '<p style="color: var(--y2k-primary);">✅ Token valide</p>';
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
        document.getElementById('github-status').innerHTML = '<p style="color: var(--y2k-primary);">✅ Dernière sauvegarde : ' + new Date().toLocaleTimeString('fr-FR') + '</p>';
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
        utilisateurActuel.parametresGithub = { sauvegardeAuto, profilPublic, partagerStatistiques };
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
        
        carte.className = `achievement-card ${estDebloque? 'unlocked' : 'locked'}`;
        carte.innerHTML = `
            <div class="achievement-card-icon">${succes.icone}</div>
            <div class="achievement-card-name">${succes.nom}</div>
            <div class="achievement-card-description">${succes.description}</div>
            <div class="achievement-card-points">+${succes.points} points</div>
        `;
        
        grille.appendChild(carte);
    });
}

function verifierSucces() {
    if (!utilisateurActuel) return;
    
    succes.forEach(succes => {
        if (utilisateurActuel.succes.includes(succes.id)) return;
        
        let debloque = false;
        
        switch (succes.id) {
            case 'premier_minuteur':
                if (utilisateurActuel.sessionsCompletees >= 1) debloque = true;
                break;
            case 'maitre_focus':
                if (utilisateurActuel.sessionsCompletees >= 50) debloque = true;
                break;
            case 'oiseau_nuit':
                const heure = new Date().getHours();
                if (heure >= 22 || heure < 6) debloque = true;
                break;
            case 'leve_tot':
                const heureMatin = new Date().getHours();
                if (heureMatin < 7) debloque = true;
                break;
            case 'marathon':
                const aujourdhui = new Date().toDateString();
                const minutesAujourdhui = utilisateurActuel.statistiquesQuotidiennes[aujourdhui] || 0;
                if (minutesAujourdhui >= 240) debloque = true;
                break;
            case 'papillon_social':
                if (utilisateurActuel.amis.length >= 5) debloque = true;
                break;
        }
        
        if (debloque) {
            utilisateurActuel.succes.push(succes.id);
            ajouterPoints(succes.points);
            afficherNotification(`Succès débloqué : ${succes.nom}!`, 'success');
            jouerSon('achievement');
        }
    });
}

// Fonctions des paramètres
function mettreAJourMinuteurPersonnalise() {
    const travail = parseInt(document.getElementById('custom-work').value);
    const pauseCourte = parseInt(document.getElementById('custom-short-break').value);
    const pauseLongue = parseInt(document.getElementById('custom-long-break').value);
    
    if (utilisateurActuel) {
        utilisateurActuel.parametres.minuteurPersonnalise = {
            tempsTravail: travail,
            pauseCourte: pauseCourte,
            pauseLongue: pauseLongue,
            cycles: 3
        };
        
        typesMinuteurs.custom = utilisateurActuel.parametres.minuteurPersonnalise;
    }
}

function mettreAJourParametresSon() {
    const active = document.getElementById('sound-enabled').checked;
    if (utilisateurActuel) {
        utilisateurActuel.parametres.sonActive = active;
    }
}

function mettreAJourInterfaceParametres() {
    if (!utilisateurActuel) return;
    
    document.getElementById('custom-work').value = utilisateurActuel.parametres.minuteurPersonnalise.tempsTravail;
    document.getElementById('custom-short-break').value = utilisateurActuel.parametres.minuteurPersonnalise.pauseCourte;
    document.getElementById('custom-long-break').value = utilisateurActuel.parametres.minuteurPersonnalise.pauseLongue;
    document.getElementById('sound-enabled').checked = utilisateurActuel.parametres.sonActive;
}

function sauvegarderParametresMinuteurPersonnalise() {
    const travail = parseInt(document.getElementById('modal-work-time').value);
    const pauseCourte = parseInt(document.getElementById('modal-short-break').value);
    const pauseLongue = parseInt(document.getElementById('modal-long-break').value);
    const cycles = parseInt(document.getElementById('modal-cycles').value);
    
    typesMinuteurs.custom = { tempsTravail: travail, pauseCourte: pauseCourte, pauseLongue: pauseLongue, cycles: cycles };
    
    if (utilisateurActuel) {
        utilisateurActuel.parametres.minuteurPersonnalise = typesMinuteurs.custom;
    }
    
    typeMinuteurActuel = 'custom';
    arreterMinuteur();
    reinitialiserMinuteur();
    mettreAJourAffichageTypeMinuteur();
    masquerModal('custom-timer-modal');
    
    afficherNotification('Paramètres du minuteur sauvegardés!', 'success');
}

// Fonctions du profil
function mettreAJourInterfaceProfil() {
    if (!utilisateurActuel) return;
    document.getElementById('profile-username').textContent = utilisateurActuel.nomUtilisateur;
    document.getElementById('profile-level').textContent = utilisateurActuel.niveau;
    document.getElementById('profile-points').textContent = utilisateurActuel.tempsEtudeTotale || 0;
    document.getElementById('last-login').textContent = utilisateurActuel.derniereConnexion;

    const etudesInput = document.getElementById('profile-etudes');
    if (etudesInput) etudesInput.value = utilisateurActuel.etudes || '';

    const userPhoto = document.getElementById('user-photo');
    if (userPhoto) userPhoto.src = utilisateurActuel.photo || DATA_URI_PLACEHOLDER;
    // Also update the small top-bar avatar
    const topPhoto = document.getElementById('top-user-photo');
    if (topPhoto) topPhoto.src = utilisateurActuel.photo || DATA_URI_PLACEHOLDER;
}

function exporterDonneesUtilisateur() {
    if (!utilisateurActuel) return;
    
    const donnees = JSON.stringify(utilisateurActuel, null, 2);
    const blob = new Blob([donnees], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `studytime_${utilisateurActuel.nomUtilisateur}_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    afficherNotification('Données exportées!', 'success');
}

function importerDonneesUtilisateur(event) {
    const fichier = event.target.files[0];
    if (!fichier) return;
    
    const lecteur = new FileReader();
    lecteur.onload = function(e) {
        try {
            const donneesUtilisateur = JSON.parse(e.target.result);
            
            if (!donneesUtilisateur.nomUtilisateur || donneesUtilisateur.pointsTotaux === undefined) {
                throw new Error('Format de fichier invalide');
            }
            
            Object.assign(utilisateurActuel, donneesUtilisateur);
            utilisateurs.set(utilisateurActuel.nomUtilisateur, utilisateurActuel);
            // Update or insert into global leaderboard list
            let globalEntry = utilisateursGlobaux.find(u => u.nomUtilisateur === utilisateurActuel.nomUtilisateur);
            if (!globalEntry) {
                utilisateursGlobaux.push({ nomUtilisateur: utilisateurActuel.nomUtilisateur, points: utilisateurActuel.pointsTotaux || 0, ligue: obtenirLigueUtilisateur(utilisateurActuel.pointsTotaux || 0), etudes: utilisateurActuel.etudes || '', tempsEtudeTotale: utilisateurActuel.tempsEtudeTotale || 0, tempsPrevu: utilisateurActuel.tempsPrevu || 0 });
            } else {
                globalEntry.points = utilisateurActuel.pointsTotaux || 0;
                globalEntry.tempsEtudeTotale = utilisateurActuel.tempsEtudeTotale || 0;
                globalEntry.tempsPrevu = utilisateurActuel.tempsPrevu || 0;
            }
            mettreAJourInterfaceUtilisateur();
            afficherNotification('Données importées avec succès!', 'success');
        } catch (erreur) {
            afficherNotification('Erreur lors de l\'import des données : ' + erreur.message, 'error');
        }
    };
    lecteur.readAsText(fichier);
}

// Utilitaires
function afficherModal(idModal) {
    document.getElementById(idModal).classList.remove('hidden');
    // Focus sur le premier input si c'est la modal de mot de passe
    if (idModal === 'github-password-modal') {
        setTimeout(() => {
            document.getElementById('github-admin-password').focus();
        }, 100);
    }
}

function masquerModal(idModal) {
    document.getElementById(idModal).classList.add('hidden');
    // Nettoyer les erreurs si c'est la modal de mot de passe
    if (idModal === 'github-password-modal') {
        document.getElementById('password-error').classList.add('hidden');
        document.getElementById('github-admin-password').value = '';
    }
}

function afficherNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--y2k-${type === 'error'? 'primary' : 'secondary'});
        color: var(--y2k-text);
        padding: var(--space-12) var(--space-16);
        border-radius: var(--radius-base);
        border: 2px solid var(--y2k-border);
        font-family: var(--font-family-pixel);
        font-size: var(--font-size-xs);
        z-index: 2000;
        max-width: 300px;
        box-shadow: 4px 4px 8px rgba(0, 0, 0, 0.5);
        animation: slideIn 0.3s ease-out;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-in forwards';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

function jouerSon(type) {
    if (!utilisateurActuel ||!utilisateurActuel.parametres.sonActive) return;
    
    const contexteAudio = new (window.AudioContext || window.webkitAudioContext)();
    const oscillateur = contexteAudio.createOscillator();
    const noeudGain = contexteAudio.createGain();
    
    oscillateur.connect(noeudGain);
    noeudGain.connect(contexteAudio.destination);
    
    switch (type) {
        case 'start':
            oscillateur.frequency.setValueAtTime(800, contexteAudio.currentTime);
            oscillateur.frequency.setValueAtTime(1000, contexteAudio.currentTime + 0.1);
            noeudGain.gain.setValueAtTime(0.1, contexteAudio.currentTime);
            noeudGain.gain.exponentialRampToValueAtTime(0.01, contexteAudio.currentTime + 0.2);
            break;
        case 'complete':
            for (let i = 0; i < 3; i++) {
                const osc = contexteAudio.createOscillator();
                const gain = contexteAudio.createGain();
                osc.connect(gain);
                gain.connect(contexteAudio.destination);
                
                osc.frequency.setValueAtTime(600 + i * 200, contexteAudio.currentTime + i * 0.15);
                gain.gain.setValueAtTime(0.1, contexteAudio.currentTime + i * 0.15);
                gain.gain.exponentialRampToValueAtTime(0.01, contexteAudio.currentTime + i * 0.15 + 0.3);
                
                osc.start(contexteAudio.currentTime + i * 0.15);
                osc.stop(contexteAudio.currentTime + i * 0.15 + 0.3);
            }
            return;
        case 'error':
            oscillateur.frequency.setValueAtTime(300, contexteAudio.currentTime);
            oscillateur.frequency.setValueAtTime(200, contexteAudio.currentTime + 0.1);
            noeudGain.gain.setValueAtTime(0.1, contexteAudio.currentTime);
            noeudGain.gain.exponentialRampToValueAtTime(0.01, contexteAudio.currentTime + 0.3);
            break;
        case 'achievement':
            const frequences = [523, 659, 784, 1047];
            frequences.forEach((freq, i) => {
                const osc = contexteAudio.createOscillator();
                const gain = contexteAudio.createGain();
                osc.connect(gain);
                gain.connect(contexteAudio.destination);
                
                osc.frequency.setValueAtTime(freq, contexteAudio.currentTime + i * 0.1);
                gain.gain.setValueAtTime(0.1, contexteAudio.currentTime + i * 0.1);
                gain.gain.exponentialRampToValueAtTime(0.01, contexteAudio.currentTime + i * 0.1 + 0.4);
                
                osc.start(contexteAudio.currentTime + i * 0.1);
                osc.stop(contexteAudio.currentTime + i * 0.1 + 0.4);
            });
            return;
    }
    
    oscillateur.start(contexteAudio.currentTime);
    oscillateur.stop(contexteAudio.currentTime + 0.2);
}

// Styles pour l'animation des notifications
const stylesNotifications = document.createElement('style');
stylesNotifications.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;

document.head.appendChild(stylesNotifications);

// Handlers for etudes and photo in profile
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        const etudesInput = document.getElementById('profile-etudes');
        if (etudesInput) {
            etudesInput.addEventListener('keydown', function(e) {
                if (e.key === 'Enter') {
                    if (utilisateurActuel) {
                        utilisateurActuel.etudes = this.value.trim();
                        // sync to global leaderboard
                        let globalEntry = utilisateursGlobaux.find(u => u.nomUtilisateur === utilisateurActuel.nomUtilisateur);
                        if (globalEntry) globalEntry.etudes = utilisateurActuel.etudes;
                        mettreAJourInterfaceProfil();
                        mettreAJourInterfaceUtilisateur();
                        afficherNotification('Etudes mises à jour !', 'success');
                    }
                }
            });
            // Update on blur as well
            etudesInput.addEventListener('blur', function() {
                if (utilisateurActuel) {
                    utilisateurActuel.etudes = this.value.trim();
                    let globalEntry = utilisateursGlobaux.find(u => u.nomUtilisateur === utilisateurActuel.nomUtilisateur);
                    if (globalEntry) globalEntry.etudes = utilisateurActuel.etudes;
                    mettreAJourInterfaceProfil();
                    mettreAJourInterfaceUtilisateur();
                }
            });
        }

        const photoInput = document.getElementById('photo-upload');
        if (photoInput) {
            photoInput.addEventListener('change', function(e) {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = function(ev) {
                        const userPhoto = document.getElementById('user-photo');
                        const topPhoto = document.getElementById('top-user-photo');
                        if (userPhoto) userPhoto.src = ev.target.result;
                        if (topPhoto) topPhoto.src = ev.target.result;
                        if (utilisateurActuel) {
                            utilisateurActuel.photo = ev.target.result;
                            // sync to global entry
                            const globalEntry = utilisateursGlobaux.find(u => u.nomUtilisateur === utilisateurActuel.nomUtilisateur);
                            if (globalEntry) globalEntry.photo = ev.target.result;
                            // Update the top bar photo
                            mettreAJourTopBar();
                        }
                    };
                    reader.readAsDataURL(file);
                }
            });
        }

        const changePhotoBtn = document.getElementById('change-photo-btn');
        if (changePhotoBtn && photoInput) {
            changePhotoBtn.addEventListener('click', function() {
                photoInput.click();
            });
        }
        // Ensure timer controls have handlers (re-bind as a safety net)
        const btnStart = document.getElementById('start-btn');
        const btnPause = document.getElementById('pause-btn');
        const btnStop = document.getElementById('stop-btn');
        const btnSkip = document.getElementById('skip-btn');
        if (btnStart) btnStart.addEventListener('click', demarrerMinuteur);
        if (btnPause) btnPause.addEventListener('click', pauserMinuteur);
        if (btnStop) btnStop.addEventListener('click', arreterMinuteur);
        if (btnSkip) btnSkip.addEventListener('click', passerMinuteur);
        // Retour à moi button
        const statsBackBtn = document.getElementById('stats-back-to-me');
        if (statsBackBtn) {
            statsBackBtn.addEventListener('click', () => {
                utilisateurAffiche = utilisateurActuel;
                afficherStatsUtilisateur(utilisateurAffiche);
                rendreStatistiquesAvancees();
            });
        }
    }, 1000);
});


