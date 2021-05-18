import { User } from "../entities/User"
import { Arg, Ctx, Field, InputType, Mutation, ObjectType, Resolver } from "type-graphql"
import argon2 from "argon2"
import { MyContext } from "src/types"

@InputType()
class UsernamePasswordInput {
  @Field()
  username: string

  @Field()
  password: string
}

@ObjectType()
class FieldError {
  @Field()
  field: string

  @Field()
  message: string
}

@ObjectType()
class UserReponse {
  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[]

  @Field(() => User, { nullable: true })
  user?: User
}

@Resolver()
export class UserResolver {
  @Mutation(() => UserReponse)
  async register(@Arg("options") options: UsernamePasswordInput, @Ctx() { em }: MyContext): Promise<UserReponse> {
    if (options.username.length <= 2) {
      return {
        errors: [
          {
            field: "username",
            message: "length must be grater than 2",
          },
        ],
      }
    }

    if (options.password.length <= 5) {
      return {
        errors: [
          {
            field: "password",
            message: "length must be grater than 5",
          },
        ],
      }
    }

    const hashedPassword = await argon2.hash(options.password)
    const user = em.create(User, { username: options.username, password: hashedPassword })

    try {
      await em.persistAndFlush(user)
    } catch (err) {
      if (err.code === "23505") {
        return {
          errors: [
            {
              field: "username",
              message: "username already taken",
            },
          ],
        }
      }
    }

    return { user }
  }

  @Mutation(() => UserReponse)
  async login(@Arg("options") options: UsernamePasswordInput, @Ctx() { em }: MyContext): Promise<UserReponse> {
    const user = await em.findOne(User, { username: options.username })

    if (!user) {
      return {
        errors: [
          {
            field: "username",
            message: "that username doesn't exist",
          },
        ],
      }
    }

    const valid = await argon2.verify(user.password, options.password)

    if (!valid) {
      return {
        errors: [
          {
            field: "password",
            message: "incorrect password",
          },
        ],
      }
    }

    return {
      user,
    }
  }
}