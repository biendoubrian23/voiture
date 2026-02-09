# 🏎️ Next.js AI Car Simulation

Une simulation de voitures autonomes qui apprennent à conduire grâce à un **Réseau de Neurones** et un **Algorithme Génétique**.

![Simulation Preview](https://github.com/biendoubrian23/voiture/assets/preview.png)

## 🚀 Fonctionnalités

- **🧠 Réseau de Neurones** : Chaque voiture possède son propre "cerveau" (Perceptron Multi-Couches).
- **🧬 Algorithme Génétique** : Sélection naturelle, croisement et mutation pour faire évoluer les voitures.
- **🎨 Éditeur de Circuit** : Dessinez vos propres circuits et testez l'IA dessus.
- **💾 Save/Load** : Sauvegardez les meilleurs "cerveaux" et chargez-les sur de nouveaux circuits pour tester leur capacité de généralisation.
- **⚡ Vitesse Variable** : Accélérez la simulation jusqu'à x50.

## 🛠️ Stack Technique

- **Framework** : Next.js 15 (App Router)
- **Langage** : TypeScript
- **Style** : Tailwind CSS
- **Rendu** : HTML5 Canvas

## 🏁 Comment lancer le projet

1. Cloner le repo :
```bash
git clone https://github.com/biendoubrian23/voiture.git
```

2. Installer les dépendances :
```bash
npm install
```

3. Lancer le serveur de développement :
```bash
npm run dev
```

4. Ouvrir [http://localhost:3000](http://localhost:3000)

## 🎮 Comment ça marche ?

1. Au début, les voitures ont des cerveaux aléatoires. Elles se crashent.
2. L'algorithme sélectionne les voitures qui sont allées le plus loin.
3. Il crée une nouvelle génération basée sur ces championnes (avec des mutations).
4. Répétez jusqu'à ce que l'IA devienne une pilote experte !

---
*Créé pour une vidéo YouTube sur l'Intelligence Artificielle.*
