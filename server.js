const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const DIST_FOLDER = path.join(__dirname, 'dist/comptabilite-asbl/browser');
const API_URL = process.env.API_URL || 'http://localhost:4000';

// Servir les fichiers statiques du build Angular
app.use(express.static(DIST_FOLDER));

// Pour toutes les routes, renvoyer index.html avec l'URL API injectée
app.get('*', (req, res) => {
  const indexPath = path.join(DIST_FOLDER, 'index.html');
  let html = fs.readFileSync(indexPath, 'utf8');
  html = html.replace(
    '<head>',
    `<head><script>window.__API_URL__="${API_URL}";</script>`
  );
  res.send(html);
});

app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});
