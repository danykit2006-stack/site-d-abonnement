import { app } from "./app";
import { config } from "./config/config";

// Le serveur API sert aussi le frontend statique pour un parcours de développement intégré.
app.listen({ hostname: config.host, port: config.port });
console.log(`Mokili+ est disponible sur http://${config.host}:${config.port}`);