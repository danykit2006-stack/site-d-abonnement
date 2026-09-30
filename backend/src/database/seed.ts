import { db } from "./db";

const subscriptionCatalog = [
  { name: "Apple Music", category: "Musique", description: "Vos titres et playlists, sans interruption.", usd: 4, cdf: 10000 },
  { name: "Spotify", category: "Musique", description: "Vos artistes préférés, où que vous soyez.", usd: 3, cdf: 7500 },
  { name: "Netflix", category: "Films & séries", description: "Une soirée cinéma commence ici.", usd: 5, cdf: 12000 },
  { name: "Prime Video", category: "Films & séries", description: "Des films, séries et découvertes à regarder.", usd: 6, cdf: 15000 },
  { name: "Snapchat+", category: "Réseau social", description: "Des fonctions exclusives pour votre compte.", usd: 5, cdf: 12000 },
  { name: "X Premium", category: "Réseau social", description: "Le niveau Premium de X, anciennement Twitter.", usd: 4, cdf: 10000 },
];
const giftCatalog = ["PSN", "Steam"];
const giftValues = [5, 10, 20, 25, 50, 75, 100];

// INSERT OR IGNORE permet de relancer le seed sans dupliquer produits ou prix.
const seed = db.transaction(() => {
  const insertProduct = db.query("INSERT OR IGNORE INTO products (name, category, description, type) VALUES (?, ?, ?, ?)");
  const productId = db.query("SELECT id FROM products WHERE name = ?");
  const insertPrice = db.query("INSERT OR IGNORE INTO product_prices (product_id, currency, amount, duration_days) VALUES (?, ?, ?, ?)");

  for (const product of subscriptionCatalog) {
    insertProduct.run(product.name, product.category, product.description, "subscription");
    const id = (productId.get(product.name) as { id: number }).id;
    insertPrice.run(id, "USD", product.usd, 30);
    insertPrice.run(id, "CDF", product.cdf, 30);
  }
  for (const name of giftCatalog) {
    insertProduct.run(name, "Cartes cadeaux", `Carte cadeau ${name}.`, "gift_card");
    const id = (productId.get(name) as { id: number }).id;
    for (const value of giftValues) insertPrice.run(id, "USD", value, null);
  }
});

seed();
console.log("Catalogue Mokili+ initialisé.");
db.close();