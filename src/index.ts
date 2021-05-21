import "reflect-metadata"
import express from "express"
import { ApolloServer } from "apollo-server-express"
import { buildSchema } from "type-graphql"
import connectRedis from "connect-redis"
import Redis from "ioredis"
import session from "express-session"
import cors from "cors"
import { createConnection } from "typeorm"

import { HelloResolver } from "./resolvers/hello"
import { PostResolver } from "./resolvers/post"
import { UserResolver } from "./resolvers/user"
import { COOKIE_NAME, __prod__ } from "./constants"
import { Post } from "./entities/Post"
import { User } from "./entities/User"
import path from "path"

const main = async () => {
  const conn = await createConnection({
    type: "postgres",
    database: "lireddit2",
    username: "postgres",
    password: "",
    logging: true,
    synchronize: true,
    migrations: [path.join(__dirname, "./migrations/*")],
    entities: [Post, User],
  })

  conn.runMigrations()

  // const orm = await MikroORM.init(mikroOrmConfig)
  // orm
  //   .getMigrator()
  //   .up()
  //   .catch((err) => console.log("migration errors: ", err))

  const app = express()

  const RedisStore = connectRedis(session)
  const redis = new Redis()

  app.use(
    cors({
      origin: "http://localhost:3000",
      credentials: true,
    })
  )

  app.use(
    session({
      name: COOKIE_NAME,
      store: new RedisStore({ client: redis, disableTouch: true }),
      cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 365 * 10, // 10 ans
        httpOnly: true,
        secure: __prod__, // only work with https
        sameSite: "lax",
      },
      saveUninitialized: false,
      secret: "grotkrgjkejj&nbvcmpwgralat",
      resave: false,
    })
  )

  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [HelloResolver, PostResolver, UserResolver],
      validate: false,
    }),
    context: ({ req, res }) => ({ req, res, redis }),
  })

  apolloServer.applyMiddleware({ app, cors: false })

  app.listen(4000, () => {
    console.log("🚀 server running on port 4000")
  })
}

main().catch((err) => {
  console.log(err)
})
