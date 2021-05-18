import type { EntityManager, IDatabaseDriver, Connection } from "@mikro-orm/core"
import type { Request, Response } from "express"
import type { Session, SessionData } from "express-session"

export type MyContext = {
  em: EntityManager<any> & EntityManager<IDatabaseDriver<Connection>>
  req: Request & {
    session: Session & Partial<SessionData> & { userId?: number }
  }
  res: Response
}
