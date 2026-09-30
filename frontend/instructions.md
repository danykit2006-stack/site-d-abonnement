Odoo Subscriptions — Guide de connaissance

1. Introduction

Odoo Subscriptions est une application permettant de vendre et de gérer des produits ou services à revenus récurrents.

Exemple utilisé dans la démonstration :

«Une entreprise souhaite vendre des cours en ligne d'initiation au design d'intérieur.»

Le principe général est de créer un produit récurrent, de proposer une offre au client, puis de laisser Odoo gérer automatiquement les paiements et le suivi de l'abonnement.

---

2. Créer un produit récurrent

Pour qu'un produit soit considéré comme un abonnement, il doit être configuré comme produit récurrent.

Exemple

Produit :

- Nom : Beginner Interior Design Class
- Type : cours en ligne
- Facturation : récurrente

Tarification basée sur le temps

Odoo permet de définir différentes périodes de récurrence :

- Hebdomadaire
- Mensuelle
- Tous les deux mois
- Autres périodes personnalisées

Il est également possible de définir différents prix selon les listes de prix des clients.

Règle importante

Produit marqué comme récurrent
        ↓
Odoo le traite comme un produit d'abonnement
        ↓
Définition de la période de facturation
        ↓
Définition du prix

Une fois configuré, le produit peut être vendu à un client sous forme d'abonnement.

---

3. Créer un devis

Lorsqu'un client souhaite souscrire à un abonnement, un devis peut être créé depuis Odoo.

Étapes

1. Créer un nouveau devis.
2. Sélectionner le client.
3. Ajouter le produit dans les lignes de commande.
4. Définir la fréquence de récurrence.
5. Appliquer éventuellement une liste de prix spécifique au client.
6. Ajouter des produits ou services supplémentaires.
7. Organiser les lignes avec des sections.
8. Ajouter des notes si nécessaire.
9. Ajouter éventuellement des produits optionnels.
10. Envoyer le devis au client.

Exemple

La cliente Sarah souhaite :

- Le cours mensuel de design d'intérieur.
- Un prix spécial correspondant à sa liste de prix VIP.
- Des fiches d'exercices en ligne.
- La possibilité d'ajouter un support technique.

Le support technique peut être configuré comme produit optionnel.

---

Envoi du devis

Le devis peut être envoyé directement depuis Odoo par e-mail.

Processus :

Création du devis
      ↓
Personnalisation du message
      ↓
Envoi par e-mail
      ↓
Client reçoit le devis

---

4. Portail client

Le client peut consulter son devis depuis le portail client Odoo.

Depuis ce portail, le client peut notamment :

- Consulter le devis.
- Ajouter des produits optionnels.
- Télécharger le PDF.
- Imprimer le devis.
- Ajouter un moyen de paiement.
- Confirmer son abonnement.

Une fois le moyen de paiement configuré, Odoo peut facturer automatiquement la carte du client lorsque la classe commence, selon la configuration de l'abonnement.

Le portail client réduit les échanges nécessaires entre le client et l'équipe commerciale.

Il est également accessible depuis les appareils mobiles.

---

5. Gestion de la satisfaction client

Une fois le client abonné, Odoo gère automatiquement son abonnement et les paiements récurrents.

L'entreprise peut également mesurer la satisfaction des clients.

Exemple de processus

Après le premier mois :

Client abonné
      ↓
1 mois écoulé
      ↓
Envoi automatique d'une enquête de satisfaction
      ↓
Analyse de la satisfaction

Pour les clients insatisfaits, Odoo peut générer une alerte automatique afin de rappeler à l'équipe commerciale de prendre contact avec eux.

Objectif

Le suivi de satisfaction permet notamment de :

- Identifier les clients insatisfaits.
- Réagir rapidement aux problèmes.
- Améliorer la fidélisation.
- Réduire les risques de résiliation.

---

6. Upselling

Lorsqu'un client possède déjà un abonnement, l'entreprise peut lui proposer des produits supplémentaires.

Exemple

Michael possède déjà un abonnement.

Il souhaite acheter un logiciel de design d'intérieur permettant de visualiser ses conceptions.

Le commercial peut utiliser la fonction Upsell pour ajouter le produit à l'abonnement existant.

Processus

Abonnement existant
      ↓
Upsell
      ↓
Ajout du nouveau produit
      ↓
Confirmation
      ↓
Mise à jour automatique de la commande récurrente

La commande récurrente est automatiquement mise à jour afin d'afficher les produits achetés par le client pour la période concernée.

---

7. Produits récurrents et non récurrents

Odoo permet de vendre simultanément :

- Des produits récurrents.
- Des produits non récurrents.

Ces produits peuvent être présents sur le même bon de commande.

Cela est possible grâce à l'intégration entre les applications Odoo Sales et Odoo Subscriptions.

---

8. MRR — Monthly Recurring Revenue

Odoo permet de suivre le MRR (Monthly Recurring Revenue), c'est-à-dire le revenu mensuel récurrent.

Le MRR permet d'observer l'évolution des revenus générés par les abonnements.

Pour un client

Il est possible d'utiliser le bouton MRR pour analyser l'évolution du revenu mensuel récurrent associé à un client comme Michael.

Pour l'ensemble de l'entreprise

Odoo dispose également de fonctionnalités de reporting permettant d'analyser le MRR de l'ensemble des services d'abonnement.

Cela permet notamment d'identifier :

- Les mois les plus rentables.
- Les variations du revenu récurrent.
- L'évolution des abonnements.
- L'efficacité des campagnes marketing.

---

9. Analyse des campagnes marketing

Odoo permet d'identifier l'origine des abonnements.

Une entreprise peut ainsi déterminer quelle campagne marketing a généré un abonnement.

Exemple

Michael a trouvé l'entreprise grâce à une campagne de publipostage (Mass Mailing).

Les commandes d'abonnement peuvent donc être associées à différentes sources ou campagnes publicitaires.

Exemples de sources :

- Moteurs de recherche.
- Réseaux sociaux.
- E-mail marketing.
- Campagnes de publipostage.

---

10. Intégration avec Odoo CRM

Les données marketing sont intégrées à l'application Odoo CRM.

Le CRM permet aux employés de :

- Suivre les sources des clients.
- Gérer les prospects.
- Suivre les opportunités commerciales.
- Gérer les ventes ponctuelles.
- Gérer les ventes par abonnement.

Exemple de flux

Campagne marketing
       ↓
Prospect
       ↓
CRM
       ↓
Opportunité commerciale
       ↓
Vente
       ↓
Abonnement

---

11. Intégration avec la comptabilité

Les factures et paiements sont automatiquement synchronisés avec l'application comptable Odoo.

Cela permet de maintenir les données comptables à jour sans nécessiter une saisie manuelle supplémentaire importante.

Flux

Abonnement
    ↓
Facturation récurrente
    ↓
Paiement
    ↓
Synchronisation avec Accounting
    ↓
Mise à jour des données comptables

---

12. Intégration avec Odoo Projects

L'application Projects permet aux différents départements de gérer leurs tâches sous forme de projets.

Les équipes peuvent ainsi organiser leur travail dans des projets :

- Structurés.
- Suivables.
- Interfonctionnels.

Odoo Subscriptions peut donc fonctionner dans un environnement comprenant plusieurs applications Odoo.

---

13. Vue d'ensemble des intégrations

Odoo Subscriptions peut fonctionner avec plusieurs applications :

Application| Fonction
Sales| Création et gestion des commandes
Subscriptions| Gestion des abonnements et paiements récurrents
CRM| Gestion des prospects et opportunités
Marketing| Suivi des campagnes et sources des clients
Accounting| Gestion des factures et paiements
Projects| Organisation des tâches et projets

Architecture simplifiée

                    ┌─────────────┐
                    │  Marketing  │
                    └──────┬──────┘
                           ↓
                    ┌─────────────┐
                    │     CRM     │
                    └──────┬──────┘
                           ↓
                    ┌─────────────┐
                    │    Sales    │
                    └──────┬──────┘
                           ↓
                 ┌───────────────────┐
                 │   Subscriptions   │
                 └───────┬───────────┘
                         ↓
              ┌──────────┴──────────┐
              ↓                     ↓
       ┌─────────────┐       ┌─────────────┐
       │ Accounting  │       │  Projects   │
       └─────────────┘       └─────────────┘

---

14. Workflow complet d'un abonnement

Le workflow présenté dans la vidéo peut être résumé ainsi :

Créer un produit récurrent
          ↓
Définir la tarification
          ↓
Créer un devis
          ↓
Ajouter le produit
          ↓
Définir la récurrence
          ↓
Ajouter les produits optionnels
          ↓
Envoyer le devis
          ↓
Client consulte le portail
          ↓
Client choisit les options
          ↓
Client ajoute son moyen de paiement
          ↓
Abonnement confirmé
          ↓
Paiements récurrents automatiques
          ↓
Enquête de satisfaction
          ↓
Suivi des clients insatisfaits
          ↓
Upselling
          ↓
Analyse du MRR
          ↓
Intégration CRM / Marketing / Accounting / Projects

---

15. Concepts clés à connaître

Produit récurrent

Produit ou service vendu selon une fréquence définie.

Récurrence

Fréquence à laquelle le client paie.

Exemples :

- Hebdomadaire
- Mensuelle
- Bimensuelle
- Tous les deux mois

Devis

Document commercial envoyé au client avant la confirmation de la vente.

Produit optionnel

Produit supplémentaire que le client peut choisir d'ajouter à son devis.

Upselling

Action consistant à proposer ou vendre un produit supplémentaire à un client existant.

MRR

Monthly Recurring Revenue : revenu mensuel récurrent généré par les abonnements.

Portail client

Interface permettant au client d'interagir directement avec ses documents et abonnements Odoo.

Satisfaction client

Mesure permettant de déterminer si les clients sont satisfaits des services proposés.

---

16. Instructions pour un agent IA

L'agent IA doit comprendre les règles suivantes concernant Odoo Subscriptions :

1. Un produit doit être configuré comme récurrent pour être vendu comme abonnement.
2. Une récurrence définit la fréquence de paiement du client.
3. Plusieurs fréquences peuvent être configurées.
4. Les prix peuvent varier selon les listes de prix.
5. Un devis peut contenir plusieurs produits et services.
6. Des produits optionnels peuvent être proposés au client.
7. Le client peut gérer certaines actions depuis son portail.
8. Les paiements d'un abonnement peuvent être récurrents et automatisés.
9. Des enquêtes de satisfaction peuvent être utilisées pour suivre l'expérience client.
10. Des alertes peuvent être configurées pour assurer le suivi des clients insatisfaits.
11. Un abonnement existant peut être augmenté avec la fonction Upsell.
12. Les produits récurrents et non récurrents peuvent être présents sur une même commande.
13. Le MRR permet d'analyser les revenus mensuels récurrents.
14. Les données marketing peuvent être associées aux abonnements.
15. Odoo Subscriptions s'intègre avec CRM, Sales, Marketing, Accounting et Projects.

---

17. Exemple pratique

Situation

Une entreprise vend un cours de design d'intérieur en ligne.

Client

Sarah souhaite suivre le cours une fois par mois.

Configuration

Produit : Beginner Interior Design Class
Type : Produit récurrent
Récurrence : Mensuelle
Liste de prix : VIP
Produit supplémentaire : Online Worksheets
Produit optionnel : Technical Support

Résultat

Sarah reçoit un devis → elle le consulte dans son portail → elle choisit éventuellement le support technique → elle ajoute son moyen de paiement → l'abonnement est confirmé → Odoo gère les paiements récurrents.

---

18. Résumé

Odoo Subscriptions permet de gérer le cycle complet d'un abonnement :

«Création du produit → Devis → Souscription → Paiements récurrents → Satisfaction → Upselling → Analyse → Comptabilité»

L'intérêt principal est de centraliser la gestion des abonnements et de connecter cette activité aux autres processus de l'entreprise grâce aux différentes applications Odoo.