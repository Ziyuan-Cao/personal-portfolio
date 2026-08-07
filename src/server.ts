import { buildApp } from "./app.js";
import { loadConfig } from "./infrastructure/config.js";
import { logger } from "./infrastructure/logger.js";
const config=loadConfig();const app=await buildApp(config);
try{await app.listen({host:config.host,port:config.port});logger.info({host:config.host,port:config.port},"Information hub started");}
catch(error){logger.error({error:error instanceof Error?error.message:String(error)},"Server failed to start");process.exitCode=1;}
