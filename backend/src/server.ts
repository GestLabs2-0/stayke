import express, { Application, Request, RequestHandler, Response, Router } from "express";
import * as http from "http";

interface MainRouteConfig {
  message?: string;
  path: string;
}

interface ServerConfiguration {
  enable404Handler?: boolean; // true para habilitar el manejador 404
  mainRoute?: boolean | MainRouteConfig; // true para ruta por defecto o config personalizada
  middleWares?: RequestHandler[];
  port: number;
  routes?: Router[];
}

export class Server {
  private _app: Application;
  private _port: number;
  private _server?: http.Server;

  constructor(serverConf: ServerConfiguration) {
    this._app = express();
    this._port = serverConf.port;

    if (serverConf.middleWares) {
      this._middlewares(serverConf.middleWares);
    }

    if (serverConf.routes) {
      this._routes(serverConf.routes);
    }

    // Configurar la ruta principal (status)
    if (serverConf.mainRoute) {
      this._setupMainRoute(serverConf.mainRoute);
    }

    // Configurar el manejador 404 (debe ser el último)
    if (serverConf.enable404Handler) {
      this._setup404Handler();
    }
  }

  _middlewares(middleWares: RequestHandler[]) {
    middleWares.forEach((middleWare) => this._app.use(middleWare));
  }

  _routes(routes: Router[]) {
    routes.forEach((route) => this._app.use(route));
  }

  listen() {
    this._server = http.createServer(this._app);
    this._server.listen(this._port, () => {
      console.log(`App listening on port ${String(this._port)}`);
    });
  }

  /**
   * Configura el manejador para rutas no encontradas (404)
   * Debe ser llamado después de configurar todas las rutas
   */
  private _setup404Handler() {
    // En Express 5+, usamos use() en lugar de all('*')
    this._app.use((req: Request, res: Response) => {
      res.status(404).json({
        error: "404 - requested resource not found",
        method: req.method,
        path: req.path,
      });
    });
  }

  /**
   * Configura la ruta principal del servidor
   * @param config - Configuración de la ruta principal (true para default o objeto personalizado)
   */
  private _setupMainRoute(config: boolean | MainRouteConfig) {
    if (typeof config === "boolean" && config) {
      // Configuración por defecto
      this._app.all("/status", (req: Request, res: Response) => {
        res.json({
          message: "Active and running server!",
          status: true,
        });
      });
    } else if (typeof config === "object") {
      // Configuración personalizada
      this._app.all(config.path, (req: Request, res: Response) => {
        res.json({
          message: config.message ?? "Server is running!",
          status: true,
        });
      });
    }
  }
}
