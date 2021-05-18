import type { Connection, EntityManager, IDatabaseDriver } from "@mikro-orm/core"
import type { Request, Response } from "express"

export type MyContext = {
  em: EntityManager<IDatabaseDriver<Connection>>
  req: Request
  res: Response
}
