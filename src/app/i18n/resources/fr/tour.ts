export const tour = {
  buttons: {
    back: "Retour",
    close: "Fermer",
    next: "Suivant",
    nextWithProgress: "Suivant ({current} sur {total})",
    last: "Terminer",
    skip: "Passer la visite",
    open: "Ouvrir la boîte de dialogue",
  },
  steps: {
    welcome: {
      title: "Bienvenue dans Notekeeper",
      body: "Un espace rapide et hors ligne pour vos notes, stockées directement sur votre appareil. Faisons un rapide tour d'horizon.",
    },
    smartViews: {
      title: "Vues intelligentes",
      body: "Passez de Toutes les notes aux Épinglées, Favorites et Récentes. Chaque vue se met à jour automatiquement.",
    },
    notebooks: {
      title: "Vos carnets",
      body: "Regroupez vos notes en carnets. Créez, renommez, épinglez, réorganisez ou supprimez-les — les carnets supprimés vont à la Corbeille et peuvent être restaurés.",
    },
    more: {
      title: "Statistiques et Corbeille",
      body: "Ouvrez les Statistiques pour mieux connaître votre écriture, et la Corbeille pour restaurer ou supprimer définitivement notes et carnets.",
    },
    newNote: {
      title: "Créer une note",
      body: "Appuyez sur + pour créer une note (ou utilisez le raccourci). Les notes s'ouvrent en fenêtre, en plein écran ou en volet partagé, selon vos réglages.",
    },
    noteList: {
      title: "Vos cartes de notes",
      body: "Chaque carte montre un aperçu, ses étiquettes et sa date de modification. Le menu ⋮ permet d'épingler, de mettre en favori, de télécharger, de déplacer, de réordonner ou de supprimer une note. Les notes épinglées remontent en haut.",
    },
    tags: {
      title: "Filtrer par étiquette",
      body: "Ajoutez des étiquettes dans vos notes, puis touchez-en une ici pour filtrer la liste. Sélectionnez-en plusieurs pour affiner davantage.",
    },
    editorTitle: {
      title: "Titre et étiquettes",
      body: "Donnez un titre à la note et ajoutez des étiquettes au fil de la saisie. Choisissez son carnet dans le sélecteur et touchez l'étoile pour l'ajouter aux favoris.",
    },
    editorToolbar: {
      title: "Écrivez en Markdown",
      body: "Mettez en forme avec la barre d'outils — titres, gras, italique, listes, listes de tâches et code. Basculez entre Édition et Aperçu pour voir le rendu.",
    },
    editorFooter: {
      title: "Enregistrement auto et mots",
      body: "Les modifications s'enregistrent automatiquement (ou via Enregistrer), avec un compteur de mots. Vous pouvez aussi copier, télécharger en Markdown ou supprimer la note.",
    },
    search: {
      title: "Trouvez tout rapidement",
      body: "Recherchez dans tous vos carnets avec une correspondance approximative. Ouvrez la palette ici ou avec le raccourci clavier.",
    },
    theme: {
      title: "Clair et sombre",
      body: "Basculez à tout moment entre le mode clair et sombre. Par défaut, il suit votre système.",
    },
    shortcuts: {
      title: "Raccourcis clavier",
      body: "Retrouvez tous les raccourcis au même endroit et personnalisez-les à votre guise.",
    },
    settings: {
      title: "Personnalisez l'application",
      body: "Dans les Paramètres, changez la couleur d'accent, la densité et les coins arrondis ; changez de langue (y compris de droite à gauche) ; réglez les notifications ; et exportez ou importez vos données.",
    },
    finish: {
      title: "Tout est prêt",
      body: "Notekeeper s'installe comme une application et fonctionne hors ligne. Vous pouvez rejouer cette visite à tout moment depuis Paramètres → À propos. Bonne prise de notes !",
    },
  },
} as const;
