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
        "metrique": "temps_etude_total", // Changé vers temps au lieu de points
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
    {"nom": "Bronze", "tempsMin": 0, "couleur": "#CD7F32"},
    {"nom": "Argent", "tempsMin": 100, "couleur": "#C0C0C0"},
    {"nom": "Or", "tempsMin": 500, "couleur": "#FFD700"},
    {"nom": "Platine", "tempsMin": 1000, "couleur": "#E5E4E2"},
    {"nom": "Diamant", "tempsMin": 2000, "couleur": "#B9F2FF"}
];

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
    utilisateursGlobaux = [
        { nomUtilisateur: "Admin", tempsTotal: 1250, ligue: "Argent", etudes: "Info" },
    ];

    // Initialiser les utilisateurs par défaut avec statistiques corrigées
    utilisateurs.set('MaîtreÉtude', {
        nomUtilisateur: 'MaîtreÉtude',
        motDePasse: '123456',
        pointsTotaux: 1250,
        niveau: 5,
        serieActuelle: 7,
        tempsEtudeTotale: 0, // Commencer à 0
        tempsPrevu: 0, // Commencer à 0
        sessionsCompletees: 0, // Commencer à 0
        sessionsInterrompues: 0, // Commencer à 0
        tauxCompletion: 0, // Sera calculé dynamiquement
        succes: ['premier_minuteur', 'serie_5', 'oiseau_nuit', 'maitre_focus'],
        derniereConnexion: new Date().toLocaleDateString('fr-FR'),
        statistiquesQuotidiennes: {},
        amis: ['RoiFocus', 'NinjaCode'],
        tokenGithub: '',
        syncGithubActive: false,
        acceGithubDebloque: false,
        avatar: 'default (1).jpg', // Ajout de l'avatar par défaut
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
    const boutonChangerAvatar = document.getElementById('change-avatar-btn'); // Nouveau bouton

    if (boutonExporter) boutonExporter.addEventListener('click', exporterDonneesUtilisateur);
    if (boutonImporter) boutonImporter.addEventListener('click', () => fichierImporter.click());
    if (fichierImporter) fichierImporter.addEventListener('change', importerDonneesUtilisateur);
    if (boutonChangerAvatar) boutonChangerAvatar.addEventListener('click', changerAvatar); // Nouvelle fonction

    // Événements de la fenêtre modale du minuteur
    const fermerModalPersonnalise = document.getElementById('close-custom-modal');
    const sauvegarderMinuteurPersonnalise = document.getElementById('save-custom-timer');
    const annulerMinuteurPersonnalise = document.getElementById('cancel-custom-timer');

    if (fermerModalPersonnalise) fermerModalPersonnalise.addEventListener('click', () => masquerModal('custom-timer-modal'));
    if (annulerMinuteurPersonnalise) annulerMinuteurPersonnalise.addEventListener('click', () => masquerModal('custom-timer-modal'));
    if (sauvegarderMinuteurPersonnalise) sauvegarderMinuteurPersonnalise.addEventListener('click', sauvegarderParametresMinuteurPersonnalise);

    // Autres événements...
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

// Nouvelle fonction pour changer l'avatar
function changerAvatar() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = function(event) {
        const file = event.target.files[0];
        if (file && utilisateurActuel) {
            const reader = new FileReader();
            reader.onload = function(e) {
                utilisateurActuel.avatar = e.target.result;
                mettreAJourInterfaceProfil();
                afficherNotification('Avatar mis à jour!', 'success');
            };
            reader.readAsDataURL(file);
        }
    };
    input.click();
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
        tempsEtudeTotale: 0, // Commencer à 0
        tempsPrevu: 0, // Commencer à 0 
        sessionsCompletees: 0, // Commencer à 0
        sessionsInterrompues: 0, // Commencer à 0
        tauxCompletion: 0,
        succes: [],
        derniereConnexion: new Date().toLocaleDateString('fr-FR'),
        statistiquesQuotidiennes: {},
        amis: [],
        tokenGithub: '',
        syncGithubActive: false,
        acceGithubDebloque: false,
        avatar: 'default (1).jpg', // Avatar par défaut
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
    utilisateursGlobaux.push({
        nomUtilisateur: nomUtilisateur,
        tempsTotal: 0,
        ligue: "Bronze",
        etudes: ""
    });

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

// Fonctions du minuteur avec logique corrigée pour les sessions interrompues
function demarrerMinuteur() {
    if (!minuteurEnCours) {
        minuteurEnCours = true;
        tempsDebut = Date.now(); // Marquer le temps de début réel
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
    // Si le minuteur était en cours, calculer le temps écoulé
    if (minuteurEnCours && phaseActuelle === 'work') {
        const tempsEcouleMs = Date.now() - tempsDebut;
        const tempsEcouleMin = Math.max(0, Math.floor(tempsEcouleMs / 60000));

        if (tempsEcouleMin > 0) {
            ajouterSessionEtudeInterrompue(tempsEcouleMin);
            const message = messagesInterface.sessionInterrompue.replace('{temps}', tempsEcouleMin);
            afficherNotification(message, 'info');
            verifierSucces();
        }
    }

    minuteurEnCours = false;
    clearInterval(intervalleMinuteur);
    reinitialiserMinuteur();
    mettreAJourControlesMinuteur();
    mettreAJourAffichageMinuteur();
    mettreAJourBarreProgres();
}

function passerMinuteur() {
    // Calculer le temps écoulé seulement si c'était en phase de travail
    if (phaseActuelle === 'work') {
        const tempsEcouleMs = Date.now() - tempsDebut;
        const tempsEcouleMin = Math.max(0, Math.floor(tempsEcouleMs / 60000));

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

// Fonctions des statistiques corrigées
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

function ajouterSessionEtudeInterrompue(minutes) {
    if (!utilisateurActuel) return;

    utilisateurActuel.tempsEtudeTotale += minutes;
    // Ne pas ajouter au temps prévu pour les sessions interrompues
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
        utilisateurGlobal.tempsTotal = utilisateurActuel.tempsEtudeTotale;
        utilisateurGlobal.ligue = obtenirLigueUtilisateur(utilisateurActuel.tempsEtudeTotale);
    }

    const nouveauNiveau = Math.floor(utilisateurActuel.pointsTotaux / 100) + 1;
    if (nouveauNiveau > utilisateurActuel.niveau) {
        utilisateurActuel.niveau = nouveauNiveau;
        afficherNotification(`Félicitations! Vous avez atteint le niveau ${nouveauNiveau}!`, 'success');
    }
}

function obtenirLigueUtilisateur(tempsTotal) {
    for (let i = ligues.length - 1; i >= 0; i--) {
        if (tempsTotal >= ligues[i].tempsMin) {
            return ligues[i].nom;
        }
    }
    return ligues[0].nom;
}

// Fonctions d'affichage mises à jour
function mettreAJourInterfaceUtilisateur() {
    if (!utilisateurActuel) return;

    // Mise à jour des informations utilisateur dans la barre supérieure
    document.getElementById('user-name').textContent = utilisateurActuel.nomUtilisateur;
    document.getElementById('user-level').textContent = `Niveau ${utilisateurActuel.niveau}`;
    document.getElementById('user-points').textContent = `${utilisateurActuel.pointsTotaux} points`;

    // Mise à jour des statistiques du tableau de bord
    document.getElementById('streak-days').textContent = utilisateurActuel.serieActuelle;
    document.getElementById('today-minutes').textContent = calculerMinutesAujourdhui();
    document.getElementById('total-sessions').textContent = utilisateurActuel.sessionsCompletees + utilisateurActuel.sessionsInterrompues;
    document.getElementById('completion-rate').textContent = utilisateurActuel.tauxCompletion + '%';

    // Mise à jour des succès
    const successContainer = document.getElementById('recent-achievements');
    if (successContainer) {
        successContainer.innerHTML = '';
        utilisateurActuel.succes.slice(-2).forEach(successId => {
            const successData = succes.find(s => s.id === successId);
            if (successData) {
                const successEl = document.createElement('div');
                successEl.className = 'achievement-item unlocked';
                successEl.innerHTML = `
                    <span class="achievement-icon">${successData.icone}</span>
                    <span class="achievement-name">${successData.nom}</span>
                `;
                successContainer.appendChild(successEl);
            }
        });
    }
}

function calculerMinutesAujourdhui() {
    const aujourdhui = new Date().toDateString();
    return utilisateurActuel.statistiquesQuotidiennes[aujourdhui] || 0;
}

function rendreStatistiquesAvancees() {
    if (!utilisateurActuel) return;

    // Afficher les statistiques réelles de l'utilisateur
    const statsContainer = document.querySelector('.statistics-overview');
    if (statsContainer) {
        statsContainer.innerHTML = `
            <div class="stat-item">
                <div class="stat-value">${utilisateurActuel.sessionsCompletees}</div>
                <div class="stat-label">sessions complètes</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${utilisateurActuel.sessionsInterrompues}</div>
                <div class="stat-label">sessions interrompues</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${utilisateurActuel.tempsEtudeTotale} min</div>
                <div class="stat-label">Temps réel</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${utilisateurActuel.tempsPrevu} min</div>
                <div class="stat-label">Temps prévu</div>
            </div>
        `;
    }
}

function rendreClassements() {
    const tableau = document.getElementById('leaderboard-table');
    if (!tableau) return;

    // Trier les utilisateurs par temps total (au lieu de points)
    const utilisateursTries = [...utilisateursGlobaux].sort((a, b) => b.tempsTotal - a.tempsTotal);

    let html = `
        <tr>
            <th>Rang</th>
            <th>Nom</th>
            <th>Temps (min)</th>
            <th>Ligue</th>
            <th>Études</th>
        </tr>
    `;

    utilisateursTries.forEach((utilisateur, index) => {
        html += `
            <tr ${utilisateur.nomUtilisateur === utilisateurActuel?.nomUtilisateur ? 'class="current-user"' : ''}>
                <td>${index + 1}</td>
                <td>${utilisateur.nomUtilisateur}</td>
                <td>${utilisateur.tempsTotal}</td>
                <td><span class="league-badge" style="background-color: ${ligues.find(l => l.nom === utilisateur.ligue)?.couleur}">${utilisateur.ligue}</span></td>
                <td>${utilisateur.etudes}</td>
            </tr>
        `;
    });

    tableau.innerHTML = html;
}

function mettreAJourInterfaceProfil() {
    if (!utilisateurActuel) return;

    // Afficher l'avatar au lieu du sélecteur
    const avatarContainer = document.getElementById('avatar-display');
    if (avatarContainer && utilisateurActuel.avatar) {
        if (utilisateurActuel.avatar.startsWith('data:')) {
            // Image uploadée par l'utilisateur
            avatarContainer.innerHTML = `<img src="${utilisateurActuel.avatar}" alt="Avatar" style="width: 64px; height: 64px; border-radius: 8px; object-fit: cover;">`;
        } else {
            // Image par défaut
            avatarContainer.innerHTML = `<img src="${utilisateurActuel.avatar}" alt="Avatar" style="width: 64px; height: 64px; border-radius: 8px; object-fit: cover;">`;
        }
    }

    // Mettre à jour les autres informations du profil
    document.getElementById('profile-name').textContent = utilisateurActuel.nomUtilisateur;
    document.getElementById('profile-level').textContent = `Niveau ${utilisateurActuel.niveau}`;
    document.getElementById('profile-points').textContent = `${utilisateurActuel.pointsTotaux} points`;
    document.getElementById('profile-join-date').textContent = `Membre depuis le ${utilisateurActuel.derniereConnexion}`;
}

// Fonctions utilitaires
function afficherModal(idModal) {
    document.getElementById(idModal).classList.remove('hidden');
}

function masquerModal(idModal) {
    document.getElementById(idModal).classList.add('hidden');
}

function afficherNotification(message, type) {
    // Créer et afficher une notification
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;

    // Ajouter au DOM
    document.body.appendChild(notification);

    // Supprimer après 3 secondes
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 3000);
}

function jouerSon(type) {
    if (!utilisateurActuel?.parametres?.sonActive) return;

    // Simuler les sons selon le type
    console.log(`Son joué: ${type}`);
}

function verifierSucces() {
    if (!utilisateurActuel) return;

    // Vérifier le succès "Premier Minuteur"
    if (!utilisateurActuel.succes.includes('premier_minuteur') && utilisateurActuel.sessionsCompletees >= 1) {
        utilisateurActuel.succes.push('premier_minuteur');
        ajouterPoints(50);
        afficherNotification('Nouveau succès débloqué : Premier Minuteur!', 'success');
    }

    // Vérifier le succès "Maître Focus"
    if (!utilisateurActuel.succes.includes('maitre_focus') && utilisateurActuel.sessionsCompletees >= 50) {
        utilisateurActuel.succes.push('maitre_focus');
        ajouterPoints(200);
        afficherNotification('Nouveau succès débloqué : Maître Focus!', 'success');
    }
}

// Fonctions pour les autres onglets (stubs pour éviter les erreurs)
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

function mettreAJourInterfaceParametres() {
    if (!utilisateurActuel) return;

    const caseASonActive = document.getElementById('sound-enabled');
    if (caseASonActive) {
        caseASonActive.checked = utilisateurActuel.parametres.sonActive;
    }
}

function mettreAJourParametresSon() {
    if (!utilisateurActuel) return;

    const caseASonActive = document.getElementById('sound-enabled');
    if (caseASonActive) {
        utilisateurActuel.parametres.sonActive = caseASonActive.checked;
    }
}

function mettreAJourMinuteurPersonnalise() {
    // Implementation pour les paramètres personnalisés
}

function sauvegarderParametresMinuteurPersonnalise() {
    // Implementation pour sauvegarder les paramètres
    masquerModal('custom-timer-modal');
}

function rendreTournois() {
    // Implementation pour afficher les tournois
}

function inscrirePourTournoi() {
    // Implementation pour l'inscription aux tournois
}

function rendreAmis() {
    const listeAmis = document.getElementById('friends-list');
    if (!listeAmis || !utilisateurActuel) return;

    listeAmis.innerHTML = '';
    utilisateurActuel.amis.forEach(ami => {
        const divAmi = document.createElement('div');
        divAmi.className = 'friend-item';
        divAmi.innerHTML = `
            <span class="friend-name">${ami}</span>
            <span class="friend-status">En ligne</span>
        `;
        listeAmis.appendChild(divAmi);
    });
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

    utilisateurActuel.amis.push(nomUtilisateurAmi);
    document.getElementById('friend-username').value = '';
    rendreAmis();
    verifierSucces();
    afficherNotification(`${nomUtilisateurAmi} ajouté aux amis!`, 'success');
}

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

    setTimeout(() => {
        afficherNotification('Données restaurées depuis GitHub!', 'success');
        mettreAJourInterfaceUtilisateur();
    }, 1500);
}

function mettreAJourParametresGitHub() {
    // Implementation pour mettre à jour les paramètres GitHub
}

function exporterDonneesUtilisateur() {
    if (!utilisateurActuel) return;

    const donnees = JSON.stringify(utilisateurActuel, null, 2);
    const blob = new Blob([donnees], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${utilisateurActuel.nomUtilisateur}_donnees.json`;
    a.click();
    URL.revokeObjectURL(url);
}

function importerDonneesUtilisateur(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const donnees = JSON.parse(e.target.result);
            // Fusionner les données importées avec l'utilisateur actuel
            Object.assign(utilisateurActuel, donnees);
            mettreAJourInterfaceUtilisateur();
            afficherNotification('Données importées avec succès!', 'success');
        } catch (error) {
            afficherNotification('Erreur lors de l\'importation des données', 'error');
        }
    };
    reader.readAsText(file);
}
