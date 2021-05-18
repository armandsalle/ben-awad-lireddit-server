import "reflect-metadata"
import { MikroORM } from "@mikro-orm/core"
import express from "express"
import { ApolloServer } from "apollo-server-express"
import { buildSchema } from "type-graphql"

import mikroOrmConfig from "./mikro-orm.config"
import { HelloResolver } from "./resolvers/hello"
import { PostResolver } from "./resolvers/post"

const main = async () => {
  const orm = await MikroORM.init(mikroOrmConfig)
  orm.getMigrator().up()

  const app = express()

  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [HelloResolver, PostResolver],
      validate: false,
    }),
    context: () => ({ em: orm.em }),
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
