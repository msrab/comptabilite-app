const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DIST_FOLDER = path.join(__dirname, 'dist/comptabilite-asbl/browser');

// Servir les fichiers statiques du build Angular
app.use(express.static(DIST_FOLDER));

// Pour toutes les routes, renvoyer index.html (SPA routing)
app.get('*', (req, res) => {
  res.sendFile(path.join(DIST_FOLDER, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});
