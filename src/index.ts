import "reflect-metadata"
import { MikroORM } from "@mikro-orm/core"
import express from "express"
import { ApolloServer } from "apollo-server-express"
import { buildSchema } from "type-graphql"
import connectRedis from "connect-redis"
import redis from "redis"
import session from "express-session"

import mikroOrmConfig from "./mikro-orm.config"
import { HelloResolver } from "./resolvers/hello"
import { PostResolver } from "./resolvers/post"
import { UserResolver } from "./resolvers/user"
import { __prod__ } from "./constants"

const main = async () => {
  const orm = await MikroORM.init(mikroOrmConfig)
  orm.getMigrator().up()

  const app = express()

  const RedisStore = connectRedis(session)
  const redisClient = redis.createClient()

  app.use(
    session({
      name: "qid",
      store: new RedisStore({ client: redisClient, disableTouch: true }),
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
    context: ({ req, res }) => ({ em: orm.em, req, res }),
  })

  apolloServer.applyMiddleware({ app })

  app.listen(4000, () => {
    console.log("🚀 server running on port 4000")
  })

  // const post = orm.em.create(Post, { title: "my first post" })
  // await orm.em.persistAndFlush(post)

  // const post = await orm.em.find(Post, {})
  // console.log(post)
}

main().catch((err) => {
  console.log(err)
})
