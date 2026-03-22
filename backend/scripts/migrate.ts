import { input, rawlist } from "@inquirer/prompts";
import shell from "shelljs";

/**
 * Stayke migration script
 *
 * Run with:   yarn tsx scripts/migrate.ts
 *
 * Uses the single AppDataSource defined in src/database/appDataSource.ts
 */

const DATASOURCE_PATH = "./src/database/appDataSource.ts";

const MIGRATIONS_DIR = "./src/database/migrations";

const TASKS = [
  { name: "Run all pending migrations", value: "run" },
  { name: "Revert last migration", value: "revert" },
  { name: "Show migration status", value: "show" },
  { name: "Generate new migration (from entity diff)", value: "generate" },
] as const;

type Task = (typeof TASKS)[number]["value"];

function typeormCmd(command: string, extra = ""): string {
  return `yarn typeorm-ts-node-esm migration:${command} -d ${DATASOURCE_PATH} ${extra}`.trim();
}

async function run(): Promise<void> {
  const task = await rawlist<Task>({
    choices: TASKS,
    message: "¿Qué tarea quieres ejecutar?",
  });

  switch (task) {
    case "run": {
      shell.exec(typeormCmd("run"));
      break;
    }

    case "revert": {
      shell.exec(typeormCmd("revert"));
      break;
    }

    case "show": {
      shell.exec(typeormCmd("show"));
      break;
    }

    case "generate": {
      const name = await input({
        default: "staykeSchema",
        message: "Nombre de la migración:",
      });
      const outPath = `${MIGRATIONS_DIR}/${name}`;
      shell.exec(typeormCmd("generate", outPath));
      break;
    }
  }
}

run().catch((err: unknown) => {
  console.error("Error en el script de migración:", err);
  process.exit(1);
});
